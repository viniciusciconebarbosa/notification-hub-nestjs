import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { NotificationStatus } from './enums/notification-status.enum';
import { AiService } from '../ai/ai.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
    private readonly aiService: AiService,

    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) {}

  async processNotification(dto: SendNotificationDto) {
    this.logger.log(`Processing notification for App: ${dto.appId}`);

    if (!dto.recipientEmail) {
      throw new BadRequestException('E-mail is required');
    }

    let finalContent = dto.content;

    if (dto.useAI) {
      this.logger.log('Refining content with AI...');
      finalContent = await this.refineContentWithAI(dto.content);
    }

    this.logger.debug(
      'Final content ready. Saving notification to database...',
    );

    const newNotification = this.repository.create({
      ...dto,
      originalContent: dto.content,
      content: finalContent,
      status: NotificationStatus.PENDING,
    });

    const saved = await this.repository.save(newNotification);
    this.logger.log(`Notification saved in the database with ID: ${saved.id}`);

    await this.mailQueue.add(
      'send-mail',
      {
        notificationId: saved.id,
        email: saved.recipientEmail,
        content: saved.content,
        appId: saved.appId,
        subject: dto.subject,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

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
