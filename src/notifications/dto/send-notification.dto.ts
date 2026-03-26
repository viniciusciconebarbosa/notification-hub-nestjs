import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({
    description: 'Identificador do sistema/app de origem',
    example: 'biblioteca-app',
  })
  @IsString()
  @IsNotEmpty()
  appId: string;

  @ApiProperty({
    description: 'E-mail do destinatário',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'O e-mail do destinatário é inválido' })
  recipientEmail: string;

  @ApiProperty({
    description: 'Nome do destinatário',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({
    description: 'Assunto do e-mail',
    example: 'Confirmação de reserva',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Conteúdo principal da notificação',
    example: 'Sua reserva foi confirmada para amanhã às 10h.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Quando true, o conteúdo é refinado pela IA antes do envio',
    default: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  useAI?: boolean;
}