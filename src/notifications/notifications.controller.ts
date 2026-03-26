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

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Envia uma nova notificação por e-mail' })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ status: 201, description: 'Notificação processada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou e-mail ausente.' })
  async send(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.processNotification(sendNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as notificações enviadas' })
  @ApiResponse({ status: 200, description: 'Lista de notificações retornada com sucesso.' })
  async findAll() {
    return this.notificationsService.findAll();
  }
}