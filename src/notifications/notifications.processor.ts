import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationStatus } from './enums/notification-status.enum';
import { Logger } from '@nestjs/common';

@Processor('mail-queue')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly mailerService: MailerService,

    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { notificationId, email, subject, content, appId } = job.data;

    try {
      this.logger.log(`[Job ${job.id}] Enviando e-mail para ${email}...`);

      const result = await this.mailerService.sendMail({
        to: email,
        subject: subject || 'Nova Notificação',
        text: content,
        html: this.generateHtml(appId, content),
      });
      this.logger.log(`result`);

      await this.repository.update(notificationId, {
        status: NotificationStatus.SENT,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Erro no Job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  private generateHtml(appId: string, content: string): string {
    return `
      <div style="font-family: sans-serif; background-color: #f0f2f5; padding: 40px 20px; color: #1c1e21;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); overflow: hidden;">
              <div style="height: 6px; background-color: #4f46e5;"></div>

              <div style="padding: 40px;">
                <h2 style="margin-top: 0; color: #1c1e21; font-size: 22px;">Nova Notificação</h2>

                <p style="font-size: 14px; color: #65676b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 25px;">
                  Origem: <strong>${appId}</strong>
                </p>

                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; border: 1px solid #e4e6eb;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2e3338;">
                    ${content.replace(/\n/g, '<br>')}
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
          </div>`;
  }
}
