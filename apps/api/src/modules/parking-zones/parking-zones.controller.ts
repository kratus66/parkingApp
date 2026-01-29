import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ParkingZonesService } from './parking-zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { SearchZonesDto } from './dto/search-zones.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('zones')
export class ParkingZonesController {
  constructor(private readonly zonesService: ParkingZonesService) {}

  @Get()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar zonas con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de zonas' })
  search(@Query() searchDto: SearchZonesDto, @CurrentUser() user: any) {
    return this.zonesService.search(searchDto, user);
  }

  @Get(':id')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener zona por ID' })
  @ApiResponse({ status: 200, description: 'Zona encontrada' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.zonesService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nueva zona' })
  @ApiResponse({ status: 201, description: 'Zona creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Zona duplicada' })
  create(@Body() createZoneDto: CreateZoneDto, @CurrentUser() user: any) {
    return this.zonesService.create(createZoneDto, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar zona' })
  @ApiResponse({ status: 200, description: 'Zona actualizada' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateZoneDto: UpdateZoneDto,
    @CurrentUser() user: any,
  ) {
    return this.zonesService.update(id, updateZoneDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar zona (soft delete)' })
  @ApiResponse({ status: 200, description: 'Zona eliminada' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    await this.zonesService.remove(id, user);
    return { message: 'Zona eliminada exitosamente' };
  }
}
