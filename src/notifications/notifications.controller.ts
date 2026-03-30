import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enfileira uma notificação para envio assíncrono por e-mail',
    description:
      'Salva a notificação no banco, aplica refinamento de IA (opcional) e enfileira o envio do e-mail via BullMQ. O e-mail é entregue de forma assíncrona pelo worker em background.',
  })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notificação enfileirada com sucesso. O e-mail será enviado em background pelo worker.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou e-mail ausente.',
  })
  async send(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.processNotification(sendNotificationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todas as notificações',
    description: 'Retorna todas as notificações registradas, ordenadas pela mais recente. O status reflete o resultado do processamento assíncrono: PENDING (aguardando worker), SENT (e-mail entregue) ou FAILED (erro no envio).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações retornada com sucesso.',
  })
  async findAll() {
    return this.notificationsService.findAll();
  }
  @EventPattern('notification.routingKey')
  async handleNotification(@Payload() data: SendNotificationDto) {
    return this.notificationsService.processNotification(data);
  }
}