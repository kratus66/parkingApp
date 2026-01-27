import {
  Controller,
  Post,
  Get,
  Body,
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
import { CountsService } from '../services/counts.service';
import { CreateCountDto } from '../dto/count.dto';

@ApiTags('CashCounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash/counts')
export class CountsController {
  constructor(private countsService: CountsService) {}

  @Post()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar/actualizar conteo de arqueo (upsert)',
    description:
      'Guarda el conteo físico por método de pago. Para CASH valida denominaciones.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteo guardado (creado o actualizado)',
  })
  @ApiResponse({
    status: 400,
    description: 'Error en validación de denominaciones',
  })
  @ApiResponse({
    status: 404,
    description: 'Turno no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'No se puede modificar conteo de turno cerrado',
  })
  async upsert(@Body() dto: CreateCountDto, @Req() req: any) {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    return await this.countsService.upsert(dto, userId, companyId);
  }

  @Get()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar conteos de un turno' })
  @ApiQuery({
    name: 'cashShiftId',
    required: true,
    description: 'ID del turno',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conteos por método',
  })
  async findByShift(@Query('cashShiftId') cashShiftId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return await this.countsService.findByShift(cashShiftId, companyId);
  }
}
