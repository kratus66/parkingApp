import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OccupancyService, OccupancySummary } from './occupancy.service';
import { AssignSpotDto } from './dto/assign-spot.dto';
import { OccupancyQueryDto } from './dto/occupancy-query.dto';
import { VehicleType } from '../../entities/parking-zone.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Occupancy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('occupancy')
export class OccupancyController {
  constructor(private readonly occupancyService: OccupancyService) {}

  @Get('summary')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener resumen de ocupación de puestos' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de ocupación obtenido correctamente',
  })
  getSummary(@CurrentUser() user: any, @Query() dto: OccupancyQueryDto): Promise<OccupancySummary> {
    return this.occupancyService.getSummary(user.companyId, dto);
  }

  @Get('available')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener puestos disponibles por tipo de vehículo' })
  @ApiResponse({
    status: 200,
    description: 'Puestos disponibles obtenidos correctamente',
  })
  getAvailableSpots(
    @CurrentUser() user: any,
    @Query('parkingLotId') parkingLotId: string,
    @Query('vehicleType') vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'TRUCK_BUS',
  ) {
    return this.occupancyService.getAvailableSpots(
      user.companyId,
      parkingLotId,
      vehicleType as VehicleType,
    );
  }

  @Post('assign')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Asignar automáticamente un puesto disponible' })
  @ApiResponse({
    status: 200,
    description: 'Puesto asignado correctamente',
  })
  @ApiResponse({
    status: 409,
    description: 'No hay puestos disponibles para el tipo de vehículo',
  })
  assignSpot(@CurrentUser() user: any, @Body() dto: AssignSpotDto) {
    return this.occupancyService.assignSpot(user.companyId, user.id, dto);
  }

  @Post('release/:spotId')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Liberar un puesto ocupado' })
  @ApiResponse({
    status: 200,
    description: 'Puesto liberado correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'El puesto no está ocupado',
  })
  releaseSpot(
    @Param('spotId') spotId: string,
    @CurrentUser() user: any,
    @Body('reason') reason?: string,
  ) {
    return this.occupancyService.releaseSpot(user.companyId, user.id, spotId, reason);
  }
}
