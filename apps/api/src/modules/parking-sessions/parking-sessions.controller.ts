import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ParkingSessionsService } from './parking-sessions.service';
import { CheckInDto } from './dto/sprint4-check-in.dto';
import { ReprintTicketDto } from './dto/reprint-ticket.dto';
import { CancelSessionDto } from './dto/cancel-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('ParkingSessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking-sessions')
export class ParkingSessionsController {
  constructor(
    private readonly parkingSessionsService: ParkingSessionsService,
  ) {}

  @Post('check-in')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar entrada de vehículo' })
  @ApiResponse({
    status: 201,
    description: 'Vehículo registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No hay espacios disponibles o datos inválidos',
  })
  checkIn(@Body() checkInDto: CheckInDto, @CurrentUser() user: User) {
    return this.parkingSessionsService.checkIn(checkInDto, user);
  }

  @Post('reprint-ticket')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reimprimir ticket' })
  @ApiResponse({ status: 200, description: 'Ticket reimpreso exitosamente' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  reprintTicket(
    @Body() reprintDto: ReprintTicketDto,
    @CurrentUser() user: User,
  ) {
    return this.parkingSessionsService.reprintTicket(reprintDto, user);
  }

  @Post('cancel')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar sesión activa' })
  @ApiResponse({ status: 200, description: 'Sesión cancelada exitosamente' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  cancel(@Body() cancelDto: CancelSessionDto, @CurrentUser() user: User) {
    return this.parkingSessionsService.cancelSession(cancelDto, user);
  }

  @Post(':id/check-out')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar salida de vehículo' })
  @ApiResponse({ status: 200, description: 'Salida registrada exitosamente' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  checkOut(@Param('id') id: string, @CurrentUser() user: User) {
    return this.parkingSessionsService.checkOut(id, user);
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener todas las sesiones activas del parqueadero' })
  @ApiResponse({ status: 200, description: 'Lista de sesiones activas' })
  @ApiQuery({ name: 'parkingLotId', required: false, description: 'ID del parqueadero (opcional)' })
  async findAllActive(
    @CurrentUser() user: User,
    @Query('parkingLotId') parkingLotId?: string,
  ) {
    try {
      const lotId = parkingLotId || user.parkingLotId;
      const sessions = await this.parkingSessionsService.findAllActive(lotId);
      console.log(`✅ Found ${sessions.length} active sessions`);
      return sessions;
    } catch (error) {
      console.error('❌ Error in findAllActive:', error);
      throw error;
    }
  }

  @Get('by-plate/:plate')
  @ApiOperation({ summary: 'Buscar sesión activa por placa' })
  @ApiResponse({ status: 200, description: 'Sesión encontrada' })
  @ApiResponse({ status: 404, description: 'No se encontró sesión activa' })
  findByPlate(
    @Param('plate') plate: string,
    @CurrentUser() user: User,
  ) {
    return this.parkingSessionsService.findActiveByPlate(user.parkingLotId, plate);
  }

  @Get('by-ticket/:ticketNumber')
  @ApiOperation({ summary: 'Buscar sesión por número de ticket' })
  @ApiResponse({ status: 200, description: 'Sesión encontrada' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  findByTicketNumber(@Param('ticketNumber') ticketNumber: string) {
    return this.parkingSessionsService.findByTicketNumber(ticketNumber);
  }
}