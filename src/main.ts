import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          
      forbidNonWhitelisted: true, 
      transform: true,          
    }),
  );
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:admin123@localhost:5672'],
      queue: 'notification.queue',
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Hub de Notificações')
    .setDescription('API para envio de notificações com IA e integração SMTP')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
