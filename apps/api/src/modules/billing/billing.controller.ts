import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpsertResolutionDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing/resolutions')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get(':parkingLotId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener la resolución de numeración de un parqueadero' })
  get(@Param('parkingLotId') parkingLotId: string, @CurrentUser() user: User) {
    return this.billingService.getForLot(parkingLotId, user.companyId);
  }

  @Put()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear o actualizar la resolución de numeración (Admin)' })
  upsert(@Body() dto: UpsertResolutionDto, @CurrentUser() user: User) {
    return this.billingService.upsert(dto, user);
  }
}
