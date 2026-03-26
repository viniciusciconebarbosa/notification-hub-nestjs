import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationStatus } from './enums/notification-status.enum';

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeDto = (overrides: Partial<SendNotificationDto> = {}): SendNotificationDto => ({
  appId: 'test-app',
  recipientEmail: 'test@test.com',
  recipientName: 'Test User',
  subject: 'Test Subject',
  content: 'Hello World',
  ...overrides,
});

const makeFakeNotification = (
  overrides: Partial<NotificationEntity> = {},
): NotificationEntity => ({
  id: 'uuid-1234',
  appId: 'test-app',
  recipientEmail: 'test@test.com',
  recipientName: 'Test User',
  subject: 'Test Subject',
  originalContent: 'Hello World',
  content: 'Hello World',
  useAI: false,
  status: NotificationStatus.SENT,
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    processNotification: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  // ─── send ─────────────────────────────────────────────────────────────────

  describe('send()', () => {
    it('deve chamar notificationsService.processNotification com o DTO correto', async () => {
      const dto = makeDto();
      const expectedResult = {
        message: 'Notification processed successfully',
        sentContent: dto.content,
        aiUsed: false,
      };
      mockNotificationsService.processNotification.mockResolvedValue(expectedResult);

      const result = await controller.send(dto);

      expect(service.processNotification).toHaveBeenCalledTimes(1);
      expect(service.processNotification).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar exceção lançada pelo service', async () => {
      const dto = makeDto();
      mockNotificationsService.processNotification.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.send(dto)).rejects.toThrow('Service error');
    });

    it('deve retornar resultado com aiUsed true quando useAI está ativo', async () => {
      const dto = makeDto({ useAI: true });
      const expectedResult = {
        message: 'Notification processed successfully',
        sentContent: '[AI REFINED]: Hello World',
        aiUsed: true,
      };
      mockNotificationsService.processNotification.mockResolvedValue(expectedResult);

      const result = await controller.send(dto);

      expect(result.aiUsed).toBe(true);
      expect(result.sentContent).toContain('[AI REFINED]');
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('deve chamar notificationsService.findAll e retornar o resultado', async () => {
      const notifications = [
        makeFakeNotification({ id: 'uuid-1' }),
        makeFakeNotification({ id: 'uuid-2' }),
      ];
      mockNotificationsService.findAll.mockResolvedValue(notifications);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result).toEqual(notifications);
    });

    it('deve retornar array vazio quando não há notificações', async () => {
      mockNotificationsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });
});
