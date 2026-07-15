import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog, NotificationStatus } from '../../entities/notification-log.entity';
import { ParkingSession } from '../../entities/parking-session.entity';

export interface NotificationProvider {
  sendWhatsApp(phoneNumber: string, message: string): Promise<boolean>;
  sendEmail(email: string, subject: string, content: string): Promise<boolean>;
}

@Injectable()
export class MockNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(MockNotificationProvider.name);

  async sendWhatsApp(phoneNumber: string, message: string): Promise<boolean> {
    this.logger.log(`Mock WhatsApp enviado a ${phoneNumber}: ${message.substring(0, 50)}...`);
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simular 95% de éxito
    return Math.random() > 0.05;
  }

  async sendEmail(email: string, subject: string, content: string): Promise<boolean> {
    this.logger.log(`Mock Email enviado a ${email} - Asunto: ${subject}`);
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Simular 98% de éxito
    return Math.random() > 0.02;
  }
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private notificationLogsRepository: Repository<NotificationLog>,
    private notificationProvider: MockNotificationProvider,
  ) {}

  async sendCheckInNotification(
    session: ParkingSession, 
    ticketContent: string,
    vehiclePlate: string,
    checkInTime: Date
  ) {
    // Sin datos de contacto en la sesión, no se envían notificaciones
    // Las notificaciones se manejarían por otros medios (ej: SMS gateway, email separado)
    this.logger.log(`Notificación de check-in procesada para sesión ${session.id}`);
  }



  private formatWhatsAppMessage(
    session: ParkingSession, 
    ticketContent: string,
    vehiclePlate: string,
    checkInTime: Date
  ): string {
    return `🅿️ *TICKET DE PARKING*

📋 Ticket: ${session.ticketNumber}
🚗 Vehículo: ${vehiclePlate}
📅 Fecha: ${checkInTime.toLocaleString('es-ES')}

${ticketContent}

⚠️ Conserve este mensaje como comprobante.
ℹ️ Para consultas, contacte al establecimiento.`;
  }

  private formatEmailContent(
    session: ParkingSession, 
    ticketContent: string,
    vehiclePlate: string,
    checkInTime: Date
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ticket de Parking</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
        <h1 style="color: #333;">🅿️ TICKET DE PARKING</h1>
    </div>
    
    <div style="padding: 20px;">
        <h2>Detalles de su ticket:</h2>
        <ul style="list-style: none; padding: 0;">
            <li><strong>Número de Ticket:</strong> ${session.ticketNumber}</li>
            <li><strong>Vehículo:</strong> ${vehiclePlate}</li>
            <li><strong>Fecha de Entrada:</strong> ${checkInTime.toLocaleString('es-ES')}</li>
        </ul>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3>Ticket Impreso:</h3>
            <pre style="font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap;">${ticketContent}</pre>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <strong>⚠️ Importante:</strong> Conserve este email como comprobante de su estacionamiento.
        </div>
    </div>
    
    <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
        Para consultas, contacte al establecimiento.
    </div>
</body>
</html>`;
  }

  // Métodos para consultar logs
  async getNotificationLogs(sessionId: string) {
    return this.notificationLogsRepository.find({
      where: { parkingSessionId: sessionId },
      order: { createdAt: 'DESC' },
    });
  }

  async getFailedNotifications() {
    return this.notificationLogsRepository.find({
      where: { status: NotificationStatus.FAILED },
      order: { createdAt: 'DESC' },
    });
  }

  async retryFailedNotification(logId: string) {
    const log = await this.notificationLogsRepository.findOne({
      where: { id: logId },
    });

    if (!log || log.status !== NotificationStatus.FAILED) {
      throw new Error('Log de notificación no válido para reintento');
    }

    // Por ahora, solo marcar como en cola para reintento manual
    log.status = NotificationStatus.QUEUED;
    await this.notificationLogsRepository.save(log);
  }
}