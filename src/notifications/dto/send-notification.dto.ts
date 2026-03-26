import { IsEmail, IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  appId: string;  

  @IsEmail({}, { message: 'O e-mail do destinatário é inválido' })
  recipientEmail: string;

  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;  
 
  @IsBoolean()
  @IsOptional()
  useAI?: boolean;  
}