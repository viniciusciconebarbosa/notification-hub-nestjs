import { Injectable } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  async processNotification(dto: SendNotificationDto) {
    console.log('Recebendo notificação de:', dto.appId);
    
    // Simulação de lógica por enquanto
    return {
      status: 'success',
      message: `Notificação para ${dto.recipientName} recebida e em processamento!`,
      data: dto
    };
  }
}