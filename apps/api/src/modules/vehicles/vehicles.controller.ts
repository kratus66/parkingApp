import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { BlacklistVehicleDto } from './dto/blacklist-vehicle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Registrar un nuevo vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createVehicleDto: CreateVehicleDto, @GetUser() user: User) {
    return this.vehiclesService.create(createVehicleDto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar todos los vehículos' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos' })
  findAll(@GetUser() user: User) {
    return this.vehiclesService.findAll(user.companyId);
  }

  @Get('blacklisted')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener lista de vehículos bloqueados' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos bloqueados' })
  getBlacklisted(@GetUser() user: User) {
    return this.vehiclesService.getBlacklisted(user.companyId);
  }

  @Get('by-plate/:licensePlate')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Buscar vehículo por placa' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  findByLicensePlate(
    @Param('licensePlate') licensePlate: string,
    @GetUser() user: User,
  ) {
    return this.vehiclesService.findByLicensePlate(licensePlate, user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener detalles de un vehículo' })
  @ApiResponse({ status: 200, description: 'Detalles del vehículo' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.vehiclesService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar un vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @GetUser() user: User,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.vehiclesService.remove(id, user);
  }

  @Post(':id/blacklist')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Bloquear un vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo bloqueado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  blacklist(
    @Param('id') id: string,
    @Body() blacklistDto: BlacklistVehicleDto,
    @GetUser() user: User,
  ) {
    return this.vehiclesService.blacklist(id, blacklistDto.reason, user);
  }

  @Post(':id/unblacklist')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Desbloquear un vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo desbloqueado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  unblacklist(@Param('id') id: string, @GetUser() user: User) {
    return this.vehiclesService.unblacklist(id, user);
  }
}
