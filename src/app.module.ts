import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationEntity } from './notifications/entities/notification.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgresspassword'),
        database: config.get<string>('DB_NAME', 'notification_db'),
        entities: [NotificationEntity],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { MailtrapTransport } = require('mailtrap');
        return {
          transport: MailtrapTransport({
            token: config.getOrThrow<string>('MAILTRAP_TOKEN'),
          }),
          defaults: {
            from: {
              address: config.get<string>('MAIL_FROM_ADDRESS', 'hello@viniciusbarbosadev.app'),
              name: config.get<string>('MAIL_FROM_NAME', 'Notification Hub'),
            },
          },
        };
      },
    }),
    NotificationsModule,
  ],
})
export class AppModule {}