import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationStatus } from './enums/notification-status.enum';
import { AiService } from '../ai/ai.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
    private readonly mailerService: MailerService,
    private readonly aiService: AiService,
  ) {}

  async processNotification(dto: SendNotificationDto) {
    this.logger.log(`Processing notification for App: ${dto.appId}`);

    if (!dto.recipientEmail) {
      throw new BadRequestException('E-mail é obrigatório');
    }

    let finalContent = dto.content;

    if (dto.useAI) {
      this.logger.log('Refining content with AI...');
      finalContent = await this.refineContentWithAI(dto.content);
    }

    this.logger.debug('Final content ready. Saving notification to database...');

    const newNotification = this.repository.create({
      ...dto,
      originalContent: dto.content,
      content: finalContent,
      status: NotificationStatus.PENDING,
    });

    const saved = await this.repository.save(newNotification);
    this.logger.log(`Notification saved in the database with ID: ${saved.id}`);

    try {
      await this.mailerService.sendMail({
        to: saved.recipientEmail,
        subject: saved.subject || 'Nova Notificação do Sistema',
        text: saved.content,
        html: `
          <div style="font-family: sans-serif; background-color: #f0f2f5; padding: 40px 20px; color: #1c1e21;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); overflow: hidden;">
              <div style="height: 6px; background-color: #4f46e5;"></div>

              <div style="padding: 40px;">
                <h2 style="margin-top: 0; color: #1c1e21; font-size: 22px;">Nova Notificação</h2>

                <p style="font-size: 14px; color: #65676b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 25px;">
                  Origem: <strong>${saved.appId}</strong>
                </p>

                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; border: 1px solid #e4e6eb;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2e3338;">
                    ${saved.content.replace(/\n/g, '<br>')}
                  </p>
                </div>

                <p style="font-size: 13px; color: #8a8d91; margin-top: 30px;">
                  Esta é uma mensagem automática processada via <strong>AI Gateway</strong>.
                  Por favor, não responda a este e-mail diretamente.
                </p>
              </div>

              <div style="background-color: #f0f2f5; padding: 20px; text-align: center; font-size: 12px; color: #90949c;">
                <p style="margin: 0;">&copy; 2026 Sistema de Notificações Centralizado</p>
                <p style="margin: 5px 0 0;">Desenvolvido por Vinicius Barbosa</p>
              </div>
            </div>
          </div>
        `,
      });

      await this.repository.update(saved.id, { status: NotificationStatus.SENT });
      this.logger.log(`Notification ${saved.id} sent successfully.`);
    } catch (error) {
      await this.repository.update(saved.id, { status: NotificationStatus.FAILED });
      this.logger.error(
        `Failed to send notification ${saved.id}: ${(error as Error).message}`,
      );
    }

    return {
      message: 'Notification processed successfully',
      sentContent: finalContent,
      aiUsed: dto.useAI ?? false,
    };
  }

  async findAll(): Promise<NotificationEntity[]> {
    this.logger.log('Fetching all notifications from database');
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  private async refineContentWithAI(content: string): Promise<string> {
    try {
      return await this.aiService.refineNotificationContent(content);
    } catch (error) {
      this.logger.warn(
        `AI refinement failed, using original content as fallback. Reason: ${(error as Error).message}`,
      );
      return content;
    }
  }
}
