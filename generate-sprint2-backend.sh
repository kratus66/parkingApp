#!/bin/bash

# Script para completar Sprint 2 - Backend
# Genera todos los archivos restantes

cd "$(dirname "$0")/apps/api/src"

echo "📦 Creando controllers y módulos Sprint 2..."

# VehiclesV2 Controller
cat > modules/vehicles-v2/vehicles-v2.controller.ts << 'EOF'
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Vehicles V2')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
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
EOF

# Consents Controller
cat > modules/consents/consents.controller.ts << 'EOF'
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Consents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consents')
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Post()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar consentimiento (grant/revoke)' })
  @ApiResponse({ status: 201, description: 'Consentimiento registrado' })
  create(@Body() createConsentDto: CreateConsentDto, @CurrentUser() user: User) {
    return this.consentsService.create(createConsentDto, user);
  }

  @Get('customer/:customerId')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener estado actual + historial de consentimientos' })
  @ApiResponse({ status: 200, description: 'Consentimientos del cliente' })
  getCustomerConsents(@Param('customerId') customerId: string, @CurrentUser() user: User) {
    return this.consentsService.getCustomerConsents(customerId, user);
  }
}
EOF

# Ops Controller
cat > modules/ops/ops.controller.ts << 'EOF'
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OpsService } from './ops.service';
import { IdentifyDto } from './dto/identify.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
}
EOF

# Customers Module
cat > modules/customers/customers.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from '../../entities/customer.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), AuditModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
EOF

# VehiclesV2 Module
cat > modules/vehicles-v2/vehicles-v2.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesV2Controller } from './vehicles-v2.controller';
import { VehiclesV2Service } from './vehicles-v2.service';
import { Vehicle } from '../../entities/vehicle-v2.entity';
import { Customer } from '../../entities/customer.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Customer]), AuditModule],
  controllers: [VehiclesV2Controller],
  providers: [VehiclesV2Service],
  exports: [VehiclesV2Service],
})
export class VehiclesV2Module {}
EOF

# Consents Module
cat > modules/consents/consents.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentsController } from './consents.controller';
import { ConsentsService } from './consents.service';
import { Consent } from '../../entities/consent.entity';
import { Customer } from '../../entities/customer.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Consent, Customer]), AuditModule],
  controllers: [ConsentsController],
  providers: [ConsentsService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
EOF

# Ops Module
cat > modules/ops/ops.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { CustomersModule } from '../customers/customers.module';
import { VehiclesV2Module } from '../vehicles-v2/vehicles-v2.module';

@Module({
  imports: [CustomersModule, VehiclesV2Module],
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}
EOF

echo "✅ Archivos creados exitosamente"
echo "📝 Ahora actualiza app.module.ts para importar los nuevos módulos"
