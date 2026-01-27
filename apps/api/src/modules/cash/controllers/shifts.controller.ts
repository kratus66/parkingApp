import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ShiftsService } from '../services/shifts.service';
import { OpenShiftDto, CloseShiftDto } from '../dto/shift.dto';
import { CashShiftStatus } from '../../../entities/cash-shift.entity';

@ApiTags('CashShifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash/shifts')
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post('open')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir turno de caja' })
  @ApiResponse({
    status: 201,
    description: 'Turno abierto exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un turno abierto (conflicto con policy)',
  })
  async openShift(@Body() dto: OpenShiftDto, @Req() req: any) {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    return await this.shiftsService.openShift(dto, userId, companyId);
  }

  @Get('current')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener turno actual abierto del cajero' })
  @ApiQuery({
    name: 'parkingLotId',
    required: true,
    description: 'ID del parqueadero',
  })
  @ApiResponse({
    status: 200,
    description: 'Turno actual (null si no hay abierto)',
  })
  async getCurrentShift(@Query('parkingLotId') parkingLotId: string, @Req() req: any) {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    return await this.shiftsService.getCurrentShift(parkingLotId, userId, companyId);
  }

  @Post(':id/close')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar turno de caja' })
  @ApiResponse({
    status: 200,
    description: 'Turno cerrado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Turno no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo el cajero puede cerrar su propio turno',
  })
  async closeShift(
    @Param('id') id: string,
    @Body() dto: CloseShiftDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    return await this.shiftsService.closeShift(id, dto, userId, companyId);
  }

  @Get()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar turnos con filtros' })
  @ApiQuery({ name: 'parkingLotId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CashShiftStatus })
  @ApiQuery({ name: 'cashierUserId', required: false })
  @ApiQuery({ name: 'from', required: false, type: Date })
  @ApiQuery({ name: 'to', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'Lista de turnos',
  })
  async findAll(
    @Query('parkingLotId') parkingLotId?: string,
    @Query('status') status?: CashShiftStatus,
    @Query('cashierUserId') cashierUserId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Req() req?: any,
  ) {
    const companyId = req.user.companyId;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return await this.shiftsService.findAll(
      companyId,
      parkingLotId,
      status,
      cashierUserId,
      fromDate,
      toDate,
    );
  }

  @Get(':id/summary')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener resumen detallado de un turno' })
  @ApiResponse({
    status: 200,
    description: 'Resumen del turno con totales, pagos, movimientos y conteos',
  })
  async getShiftSummary(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return await this.shiftsService.getShiftSummary(id, companyId);
  }
}
