import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener logs de notificaciones por sesión' })
  @ApiQuery({ name: 'sessionId', required: true })
  @ApiResponse({ status: 200, description: 'Logs de notificaciones' })
  getNotificationLogs(@Query('sessionId') sessionId: string) {
    return this.notificationsService.getNotificationLogs(sessionId);
  }

  @Get('failed')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener notificaciones fallidas' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones fallidas' })
  getFailedNotifications() {
    return this.notificationsService.getFailedNotifications();
  }

  @Post('retry/:logId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Reintentar notificación fallida' })
  @ApiResponse({ status: 200, description: 'Notificación reintentada' })
  @ApiResponse({ status: 400, description: 'Log no válido para reintento' })
  retryFailedNotification(@Param('logId') logId: string) {
    return this.notificationsService.retryFailedNotification(logId);
  }
}