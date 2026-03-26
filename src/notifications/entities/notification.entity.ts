import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { NotificationStatus } from '../enums/notification-status.enum';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appId: string;

  @Column()
  recipientEmail: string;

  @Column()
  recipientName: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  originalContent: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  useAI: boolean;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @CreateDateColumn()
  createdAt: Date;
}