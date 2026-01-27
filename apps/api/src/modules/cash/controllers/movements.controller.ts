import {
  Controller,
  Post,
  Get,
  Delete,
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
import { MovementsService } from '../services/movements.service';
import { CreateMovementDto } from '../dto/movement.dto';

@ApiTags('CashMovements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash/movements')
export class MovementsController {
  constructor(private movementsService: MovementsService) {}

  @Post()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar movimiento de caja (ingreso/egreso)' })
  @ApiResponse({
    status: 201,
    description: 'Movimiento registrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Turno no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El turno debe estar abierto',
  })
  async create(@Body() dto: CreateMovementDto, @Req() req: any) {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    return await this.movementsService.create(dto, userId, companyId);
  }

  @Get()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar movimientos de un turno' })
  @ApiQuery({
    name: 'cashShiftId',
    required: true,
    description: 'ID del turno',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimientos',
  })
  async findByShift(@Query('cashShiftId') cashShiftId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return await this.movementsService.findByShift(cashShiftId, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar movimiento (requiere SUPERVISOR)' })
  @ApiQuery({
    name: 'reason',
    required: true,
    description: 'Motivo de eliminación',
  })
  @ApiResponse({
    status: 204,
    description: 'Movimiento eliminado',
  })
  @ApiResponse({
    status: 404,
    description: 'Movimiento no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'No se pueden eliminar movimientos de turno cerrado',
  })
  async delete(
    @Param('id') id: string,
    @Query('reason') reason: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    await this.movementsService.delete(id, userId, companyId, reason);
  }
}
