import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesV2Service } from './vehicles-v2.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { SearchQueryDto } from '../../common/dto/search-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Vehicles V2')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles-v2')
export class VehiclesV2Controller {
  constructor(private readonly vehiclesService: VehiclesV2Service) {}

  @Post()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Vehículo duplicado' })
  create(@Body() createVehicleDto: CreateVehicleDto, @CurrentUser() user: User) {
    return this.vehiclesService.create(createVehicleDto, user);
  }

  @Get('search')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar vehículos por placa o código' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  search(@Query() query: SearchQueryDto, @CurrentUser() user: User) {
    return this.vehiclesService.search(query, user);
  }

  @Get(':id')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener vehículo por ID' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.vehiclesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar vehículo (CASHIER: solo color/notas)' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado' })
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @CurrentUser() user: User,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, user);
  }
}
