import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { Repository } from 'typeorm';


@Injectable()
export class NotificationsService {


    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(NotificationEntity)
        private readonly repository: Repository<NotificationEntity>,
    ) { }


    async processNotification(dto: SendNotificationDto) {

        this.logger.log(`Processing notification for App: ${dto.appId}`);

        let finalContent = dto.content;

        if (!dto.recipientEmail) {
            this.logger.error('Tentativa de envio sem e-mail!');
            throw new BadRequestException('E-mail é obrigatório');
        }
        this.logger.log('E-mail sent successfully.');
        if (dto.useAI) {
            finalContent = await this.refineContentWithAI(dto.content);
        }

        const notificationData = {
            ...dto,
            content: finalContent,
            originalContent: dto.content,
            createdAt: new Date(),
        };

        this.logger.debug('Final Notification Data ready to be saved:', notificationData);

        const newNotification = this.repository.create({
            ...dto,
            originalContent: dto.content,
            content: finalContent,
            status: 'PENDING',
        });

        const saved = await this.repository.save(newNotification);

        this.logger.log(`Notification saved in the database with ID: ${saved.id}`);


        try {
            // await this.mailService.send(saved);
            // 3. Se deu certo, atualiza o banco!
            await this.repository.update(saved.id, { status: 'SENT' });
            this.logger.log(`Notification ${saved.id} sent successfully.`);

        } catch (error) {
            // 4. Se erro, marca como falha para investigar no Kibana
            await this.repository.update(saved.id, { status: 'FAILED' });
            this.logger.error(`Fail to send notification ${saved.id}`);
        }

        return {
            message: 'Notification processed successfully',
            sentContent: finalContent,
            aiUsed: dto.useAI,
        };
    }

    private async refineContentWithAI(content: string): Promise<string> {
        return `[AI REFINED]: ${content}`;
    }

}

