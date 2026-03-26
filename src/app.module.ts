import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationEntity } from './notifications/entities/notification.entity';

@Module({
  imports: [
   
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',       
      port: 5432,
      username: 'postgres',     
      password: 'postgresspassword',  
      database: 'notification_db',
      entities: [NotificationEntity],  
      synchronize: true,      
      logging: true,        
    }),
    NotificationsModule,
  ],
})
export class AppModule {}