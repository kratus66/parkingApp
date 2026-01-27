import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateTariffPlanDto } from './dto/create-tariff-plan.dto';
import { UpdateTariffPlanDto } from './dto/update-tariff-plan.dto';
import { CreateTariffRuleDto } from './dto/create-tariff-rule.dto';
import { UpdateTariffRuleDto } from './dto/update-tariff-rule.dto';
import { UpdatePricingConfigDto } from './dto/update-pricing-config.dto';
import { PricingQuoteDto } from './dto/pricing-quote.dto';
import { VehicleType, DayType, PeriodType } from '../../entities/tariff-rule.entity';

@ApiTags('Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // ============ TariffPlan Endpoints ============

  @Get('plans')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'List tariff plans' })
  @ApiQuery({ name: 'parkingLotId', required: false })
  async findAllPlans(@Query('parkingLotId') parkingLotId?: string) {
    return this.pricingService.findAllTariffPlans(parkingLotId);
  }

  @Post('plans')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Create a tariff plan' })
  async createPlan(@Body() createDto: CreateTariffPlanDto, @CurrentUser() user: User) {
    return this.pricingService.createTariffPlan(createDto, user.id);
  }

  @Patch('plans/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Update a tariff plan' })
  async updatePlan(
    @Param('id') id: string,
    @Body() updateDto: UpdateTariffPlanDto,
    @CurrentUser() user: User,
  ) {
    return this.pricingService.updateTariffPlan(id, updateDto, user.id);
  }

  @Post('plans/:id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Activate a tariff plan (deactivates others in same parkingLot)' })
  async activatePlan(@Param('id') id: string, @CurrentUser() user: User) {
    return this.pricingService.activateTariffPlan(id, user.id);
  }

  // ============ TariffRule Endpoints ============

  @Get('rules')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'List tariff rules with optional filters' })
  @ApiQuery({ name: 'parkingLotId', required: false })
  @ApiQuery({ name: 'planId', required: false })
  @ApiQuery({ name: 'vehicleType', required: false, enum: VehicleType })
  @ApiQuery({ name: 'dayType', required: false, enum: DayType })
  @ApiQuery({ name: 'period', required: false, enum: PeriodType })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async findAllRules(
    @Query('parkingLotId') parkingLotId?: string,
    @Query('planId') planId?: string,
    @Query('vehicleType') vehicleType?: VehicleType,
    @Query('dayType') dayType?: DayType,
    @Query('period') period?: PeriodType,
    @Query('active') active?: string,
  ) {
    return this.pricingService.findAllTariffRules({
      parkingLotId,
      planId,
      vehicleType,
      dayType,
      period,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  @Post('rules')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Create a tariff rule' })
  async createRule(@Body() createDto: CreateTariffRuleDto, @CurrentUser() user: User) {
    return this.pricingService.createTariffRule(createDto, user.id);
  }

  @Patch('rules/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Update a tariff rule' })
  async updateRule(
    @Param('id') id: string,
    @Body() updateDto: UpdateTariffRuleDto,
    @CurrentUser() user: User,
  ) {
    return this.pricingService.updateTariffRule(id, updateDto, user.id);
  }

  @Delete('rules/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Delete a tariff rule' })
  async deleteRule(@Param('id') id: string, @CurrentUser() user: User) {
    await this.pricingService.deleteTariffRule(id, user.id);
    return { message: 'Rule deleted successfully' };
  }

  // ============ PricingConfig Endpoints ============

  @Get('config')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get pricing config for a parkingLot' })
  @ApiQuery({ name: 'parkingLotId', required: true })
  async getConfig(@Query('parkingLotId') parkingLotId: string) {
    return this.pricingService.findPricingConfig(parkingLotId);
  }

  @Post('config')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Update or create pricing config for a parkingLot' })
  async upsertConfig(@Body() updateDto: UpdatePricingConfigDto, @CurrentUser() user: User) {
    return this.pricingService.upsertPricingConfig(updateDto, user.id);
  }

  // ============ Quote / Simulation Endpoints ============

  @Post('quote')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Simulate pricing quote' })
  async calculateQuote(@Body() quoteDto: PricingQuoteDto, @CurrentUser() user: User) {
    return this.pricingService.calculateQuote(quoteDto, user.companyId);
  }

  @Get('session/:sessionId/quote')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get pricing quote for a parking session' })
  async getSessionQuote(@Param('sessionId') sessionId: string, @CurrentUser() user: User) {
    return this.pricingService.getSessionQuote(sessionId, user.companyId);
  }
}
