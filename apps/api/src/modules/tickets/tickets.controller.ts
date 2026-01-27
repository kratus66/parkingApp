import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ExitTicketDto } from './dto/exit-ticket.dto';
import { CancelTicketDto } from './dto/cancel-ticket.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('entry')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Registrar entrada de vehículo' })
  @ApiResponse({ status: 201, description: 'Entrada registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o vehículo bloqueado' })
  entry(@Body() createTicketDto: CreateTicketDto, @GetUser() user: User) {
    return this.ticketsService.entry(createTicketDto, user);
  }

  @Post('exit/:ticketNumber')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Registrar salida de vehículo' })
  @ApiResponse({ status: 200, description: 'Salida registrada exitosamente' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  exit(
    @Param('ticketNumber') ticketNumber: string,
    @Body() exitDto: ExitTicketDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.exit(ticketNumber, exitDto, user);
  }

  @Post('cancel/:ticketNumber')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Cancelar un ticket' })
  @ApiResponse({ status: 200, description: 'Ticket cancelado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  cancel(
    @Param('ticketNumber') ticketNumber: string,
    @Body() cancelDto: CancelTicketDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.cancel(ticketNumber, cancelDto.reason, user);
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener tickets activos (vehículos en el parqueadero)' })
  @ApiResponse({ status: 200, description: 'Lista de tickets activos' })
  getActive(@GetUser() user: User) {
    return this.ticketsService.getActiveTickets(user.parkingLotId);
  }

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener historial de tickets' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Historial de tickets' })
  getHistory(
    @GetUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ticketsService.getHistory(
      user.parkingLotId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats/daily')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener estadísticas del día' })
  @ApiResponse({ status: 200, description: 'Estadísticas diarias' })
  getDailyStats(@GetUser() user: User) {
    return this.ticketsService.getDailyStats(user.parkingLotId);
  }

  @Get(':ticketNumber')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener detalles de un ticket por número' })
  @ApiResponse({ status: 200, description: 'Detalles del ticket' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  findByTicketNumber(@Param('ticketNumber') ticketNumber: string) {
    return this.ticketsService.findByTicketNumber(ticketNumber);
  }
}
