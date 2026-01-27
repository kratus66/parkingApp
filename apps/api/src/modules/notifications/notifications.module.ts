import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService, MockNotificationProvider } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationLog } from './entities/notification-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog])],
  controllers: [NotificationsController],
  providers: [NotificationsService, MockNotificationProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
