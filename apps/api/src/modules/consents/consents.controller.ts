import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
