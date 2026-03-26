import { Controller, Post, Body } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('send')
    async send(@Body() sendNotificationDto: SendNotificationDto) {

        return this.notificationsService.processNotification(sendNotificationDto);
    }
}