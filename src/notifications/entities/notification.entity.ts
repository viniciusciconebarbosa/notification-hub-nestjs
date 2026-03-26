import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

  @Column({ default: 'PENDING' })  
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}