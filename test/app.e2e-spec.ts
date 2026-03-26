import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { NotificationsService } from '../src/notifications/notifications.service';
import { NotificationEntity } from '../src/notifications/entities/notification.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationStatus } from '../src/notifications/enums/notification-status.enum';

// ─── Helpers ────────────────────────────────────────────────────────────────

const validPayload = {
  appId: 'e2e-test-app',
  recipientEmail: 'usuario@teste.com',
  recipientName: 'Usuário Teste',
  subject: 'Assunto de Teste',
  content: 'Conteúdo da notificação de teste.',
};

const makeSavedNotification = (overrides = {}): NotificationEntity => ({
  id: 'uuid-e2e-1',
  appId: validPayload.appId,
  recipientEmail: validPayload.recipientEmail,
  recipientName: validPayload.recipientName,
  subject: validPayload.subject,
  originalContent: validPayload.content,
  content: validPayload.content,
  useAI: false,
  status: NotificationStatus.PENDING,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Notifications (e2e)', () => {
  let app: INestApplication<App>;

  // Mocks reutilizados em todos os testes
  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mailerMock = {
    sendMail: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: repositoryMock,
        },
        {
          provide: MailerService,
          useValue: mailerMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Replicar a config do main.ts para os testes E2E
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/notifications/send ─────────────────────────────────────────

  describe('POST /api/notifications/send', () => {
    it('deve retornar 201 e processar notificação com payload válido', async () => {
      const saved = makeSavedNotification();
      repositoryMock.create.mockReturnValue(saved);
      repositoryMock.save.mockResolvedValue(saved);
      mailerMock.sendMail.mockResolvedValue(undefined);
      repositoryMock.update.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/notifications/send')
        .send(validPayload)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Notification processed successfully',
        sentContent: validPayload.content,
        aiUsed: false,
      });
    });

    it('deve retornar 201 com conteúdo refinado quando useAI é true', async () => {
      const aiContent = `[AI REFINED]: ${validPayload.content}`;
      const saved = makeSavedNotification({ content: aiContent, useAI: true });

      repositoryMock.create.mockReturnValue(saved);
      repositoryMock.save.mockResolvedValue(saved);
      mailerMock.sendMail.mockResolvedValue(undefined);
      repositoryMock.update.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/notifications/send')
        .send({ ...validPayload, useAI: true })
        .expect(201);

      expect(response.body.sentContent).toContain('[AI REFINED]');
      expect(response.body.aiUsed).toBe(true);
    });

    it('deve retornar 400 quando recipientEmail está ausente', async () => {
      const { recipientEmail: _removed, ...payloadSemEmail } = validPayload;

      const response = await request(app.getHttpServer())
        .post('/api/notifications/send')
        .send(payloadSemEmail)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve retornar 400 quando recipientEmail é inválido', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/notifications/send')
        .send({ ...validPayload, recipientEmail: 'email-invalido' })
        .expect(400);

      // NestJS ValidationPipe retorna message como array de erros
      expect(response.body.message).toEqual(
        expect.arrayContaining(['O e-mail do destinatário é inválido']),
      );
    });

    it('deve retornar 400 quando content está ausente', async () => {
      const { content: _removed, ...payloadSemContent } = validPayload;

      const response = await request(app.getHttpServer())
        .post('/api/notifications/send')
        .send(payloadSemContent)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve retornar 400 quando campos extras são enviados (forbidNonWhitelisted)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/notifications/send')
        .send({ ...validPayload, campoNaoPermitido: 'valor' })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve retornar 201 mesmo quando o envio de e-mail falha (status FAILED no banco)', async () => {
      const saved = makeSavedNotification();
      repositoryMock.create.mockReturnValue(saved);
      repositoryMock.save.mockResolvedValue(saved);
      mailerMock.sendMail.mockRejectedValue(new Error('SMTP error'));
      repositoryMock.update.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/notifications/send')
        .send(validPayload)
        .expect(201);

      // A API processa e retorna mesmo com falha no SMTP
      expect(response.body.message).toBe('Notification processed successfully');

      // Status FAILED deve ter sido salvo no banco
      expect(repositoryMock.update).toHaveBeenCalledWith(
        saved.id,
        { status: NotificationStatus.FAILED },
      );
    });
  });

  // ─── GET /api/notifications ───────────────────────────────────────────────

  describe('GET /api/notifications', () => {
    it('deve retornar 200 com lista de notificações', async () => {
      const notifications = [
        makeSavedNotification({ id: 'uuid-1', status: NotificationStatus.SENT }),
        makeSavedNotification({ id: 'uuid-2', status: NotificationStatus.FAILED }),
      ];
      repositoryMock.find.mockResolvedValue(notifications);

      const response = await request(app.getHttpServer())
        .get('/api/notifications')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('deve retornar 200 com array vazio quando não há notificações', async () => {
      repositoryMock.find.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/notifications')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
