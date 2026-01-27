import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OpsService } from './ops.service';
import { IdentifyDto } from './dto/identify.dto';
import { DashboardStatsQueryDto } from './dto/dashboard-stats.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ops')
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Post('identify')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Identificar cliente por placa, código bici o documento',
    description: 'Endpoint optimizado para flujo rápido de taquilla',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de identificación (found: true/false)',
  })
  identify(@Body() identifyDto: IdentifyDto, @CurrentUser() user: User) {
    return this.opsService.identify(identifyDto, user);
  }

  @Get('dashboard/stats')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener estadísticas del dashboard',
    description: 'Devuelve KPIs, ocupación por tipo de vehículo y alertas',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas correctamente',
  })
  getDashboardStats(
    @CurrentUser() user: User,
    @Query() query: DashboardStatsQueryDto,
  ) {
    return this.opsService.getDashboardStats(user, query);
  }
}
