import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ParkingSpotsService } from './parking-spots.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { SearchSpotsDto } from './dto/search-spots.dto';
import { ChangeSpotStatusDto } from './dto/change-spot-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Spots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('spots')
export class ParkingSpotsController {
  constructor(private readonly spotsService: ParkingSpotsService) {}

  @Get()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar puestos con filtros y paginación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de puestos obtenida correctamente',
  })
  search(@CurrentUser() user: any, @Query() dto: SearchSpotsDto) {
    return this.spotsService.search(user.companyId, dto);
  }

  @Get(':id')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener un puesto por ID' })
  @ApiResponse({ status: 200, description: 'Puesto encontrado' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.spotsService.findOne(id, user.companyId);
  }

  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo puesto' })
  @ApiResponse({ status: 201, description: 'Puesto creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o código duplicado' })
  create(@Body() dto: CreateSpotDto, @CurrentUser() user: any) {
    return this.spotsService.create(user.companyId, user.id, dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un puesto existente' })
  @ApiResponse({ status: 200, description: 'Puesto actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSpotDto,
    @CurrentUser() user: any,
  ) {
    return this.spotsService.update(id, user.companyId, user.id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un puesto' })
  @ApiResponse({ status: 200, description: 'Puesto eliminado correctamente' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar un puesto ocupado' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.spotsService.remove(id, user.companyId, user.id);
  }

  @Post(':id/status')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cambiar el estado de un puesto' })
  @ApiResponse({ status: 200, description: 'Estado cambiado correctamente' })
  @ApiResponse({ status: 400, description: 'Estado inválido o igual al actual' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeSpotStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.spotsService.changeStatus(id, user.companyId, user.id, dto);
  }

  @Get(':id/history')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener historial de cambios de estado de un puesto' })
  @ApiResponse({
    status: 200,
    description: 'Historial obtenido correctamente',
  })
  getStatusHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.spotsService.getStatusHistory(id, user.companyId);
  }
}
