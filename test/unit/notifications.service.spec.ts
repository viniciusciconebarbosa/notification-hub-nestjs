import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationEntity } from '../../src/notifications/entities/notification.entity';
import { BadRequestException } from '@nestjs/common';
import { NotificationStatus } from '../../src/notifications/enums/notification-status.enum';
import { SendNotificationDto } from '../../src/notifications/dto/send-notification.dto';
import { AiService } from '../../src/ai/ai.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeFakeNotification = (
  overrides: Partial<NotificationEntity> = {},
): NotificationEntity => ({
  id: 'uuid-1234',
  appId: 'test-app',
  recipientEmail: 'test@test.com',
  recipientName: 'Test User',
  subject: 'Test Subject',
  originalContent: 'Hello',
  content: 'Hello',
  useAI: false,
  status: NotificationStatus.PENDING,
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

const makeDto = (overrides: Partial<SendNotificationDto> = {}): SendNotificationDto => ({
  appId: 'test-app',
  recipientEmail: 'test@test.com',
  recipientName: 'Test User',
  subject: 'Test Subject',
  content: 'Hello World',
  ...overrides,
});

// ─── Mock Factories ──────────────────────────────────────────────────────────

const repositoryMockFactory = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
});

const mailQueueMockFactory = () => ({
  add: jest.fn(),
});

const aiServiceMockFactory = () => ({
  refineNotificationContent: jest.fn(),
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repositoryMock: ReturnType<typeof repositoryMockFactory>;
  let mailQueueMock: ReturnType<typeof mailQueueMockFactory>;
  let aiMock: ReturnType<typeof aiServiceMockFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getQueueToken('mail-queue'),
          useFactory: mailQueueMockFactory,
        },
        {
          provide: AiService,
          useFactory: aiServiceMockFactory,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repositoryMock = module.get(getRepositoryToken(NotificationEntity));
    mailQueueMock = module.get(getQueueToken('mail-queue'));
    aiMock = module.get(AiService);
  });

  // ─── processNotification ──────────────────────────────────────────────────

  describe('processNotification', () => {
    it('deve lançar BadRequestException quando recipientEmail está ausente', async () => {
      const dto = makeDto({ recipientEmail: '' });
      await expect(service.processNotification(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve salvar notificação com status PENDING e enfileirar job no BullMQ', async () => {
      const dto = makeDto();
      const savedNotification = makeFakeNotification();

      repositoryMock.create.mockReturnValue(savedNotification);
      repositoryMock.save.mockResolvedValue(savedNotification);
      mailQueueMock.add.mockResolvedValue(undefined);

      const result = await service.processNotification(dto);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationStatus.PENDING,
          originalContent: dto.content,
          content: dto.content,
        }),
      );
      expect(repositoryMock.save).toHaveBeenCalledWith(savedNotification);
      expect(mailQueueMock.add).toHaveBeenCalledWith(
        'send-mail',
        expect.objectContaining({
          notificationId: savedNotification.id,
          email: savedNotification.recipientEmail,
          content: savedNotification.content,
          appId: savedNotification.appId,
          subject: dto.subject,
        }),
        expect.objectContaining({ attempts: 3 }),
      );
      expect(result).toEqual({
        message: 'Notification processed successfully',
        sentContent: dto.content,
        aiUsed: false,
      });
    });

    it('deve refinar conteúdo com IA quando useAI é true', async () => {
      const dto = makeDto({ useAI: true });
      const refinedContent = 'Olá! Esta é uma mensagem refinada pelo Gemini.';
      const savedNotification = makeFakeNotification({
        content: refinedContent,
        useAI: true,
      });

      aiMock.refineNotificationContent.mockResolvedValue(refinedContent);
      repositoryMock.create.mockReturnValue(savedNotification);
      repositoryMock.save.mockResolvedValue(savedNotification);
      mailQueueMock.add.mockResolvedValue(undefined);

      const result = await service.processNotification(dto);

      expect(aiMock.refineNotificationContent).toHaveBeenCalledWith(dto.content);
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: refinedContent,
          originalContent: dto.content,
        }),
      );
      expect(result.sentContent).toBe(refinedContent);
      expect(result.aiUsed).toBe(true);
    });

    it('deve usar conteúdo original como fallback quando AiService falha', async () => {
      const dto = makeDto({ useAI: true });
      const savedNotification = makeFakeNotification({
        content: dto.content,
        useAI: true,
      });

      aiMock.refineNotificationContent.mockRejectedValue(new Error('Gemini API error'));
      repositoryMock.create.mockReturnValue(savedNotification);
      repositoryMock.save.mockResolvedValue(savedNotification);
      mailQueueMock.add.mockResolvedValue(undefined);

      const result = await service.processNotification(dto);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: dto.content,
          originalContent: dto.content,
        }),
      );
      expect(result.aiUsed).toBe(true);
    });

    it('deve definir originalContent com o conteúdo original mesmo quando useAI é true', async () => {
      const dto = makeDto({ useAI: true });
      const refinedContent = 'Conteúdo refinado pela IA.';
      const savedNotification = makeFakeNotification({ useAI: true });

      aiMock.refineNotificationContent.mockResolvedValue(refinedContent);
      repositoryMock.create.mockReturnValue(savedNotification);
      repositoryMock.save.mockResolvedValue(savedNotification);
      mailQueueMock.add.mockResolvedValue(undefined);

      await service.processNotification(dto);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalContent: dto.content,
        }),
      );
    });

    it('deve enfileirar job com backoff exponencial configurado', async () => {
      const dto = makeDto();
      const savedNotification = makeFakeNotification();

      repositoryMock.create.mockReturnValue(savedNotification);
      repositoryMock.save.mockResolvedValue(savedNotification);
      mailQueueMock.add.mockResolvedValue(undefined);

      await service.processNotification(dto);

      expect(mailQueueMock.add).toHaveBeenCalledWith(
        'send-mail',
        expect.any(Object),
        expect.objectContaining({
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        }),
      );
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar lista de notificações ordenada por createdAt DESC', async () => {
      const notifications = [
        makeFakeNotification({ id: 'uuid-2', createdAt: new Date('2026-01-02') }),
        makeFakeNotification({ id: 'uuid-1', createdAt: new Date('2026-01-01') }),
      ];
      repositoryMock.find.mockResolvedValue(notifications);

      const result = await service.findAll();

      expect(repositoryMock.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result).toEqual(notifications);
    });

    it('deve retornar array vazio quando não há notificações', async () => {
      repositoryMock.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
