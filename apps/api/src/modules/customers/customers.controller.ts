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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchQueryDto } from '../../common/dto/search-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Cliente duplicado' })
  create(@Body() createCustomerDto: CreateCustomerDto, @CurrentUser() user: User) {
    return this.customersService.create(createCustomerDto, user);
  }

  @Get('search')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar clientes con paginación' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  search(@Query() query: SearchQueryDto, @CurrentUser() user: User) {
    return this.customersService.search(query, user);
  }

  @Get(':id')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos (CASHIER limitado)' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() user: User,
  ) {
    return this.customersService.update(id, updateCustomerDto, user);
  }

  @Get(':id/vehicles')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener vehículos del cliente' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos' })
  getVehicles(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customersService.getVehicles(id, user);
  }

  @Get(':id/consents')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener consentimientos del cliente' })
  @ApiResponse({ status: 200, description: 'Historial y estado actual' })
  getConsents(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customersService.getConsents(id, user);
  }
}
