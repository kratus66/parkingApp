import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { VoidReasonDto } from '../checkout/dto/checkout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { PaymentStatus } from '../../entities/payment.entity';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar pagos', description: 'Lista pagos con filtros' })
  @ApiQuery({ name: 'parkingLotId', required: false })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiResponse({ status: 200, description: 'Listado de pagos' })
  async findAll(
    @Query('parkingLotId') parkingLotId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('status') status: PaymentStatus,
    @Req() req: any,
  ) {
    const { companyId } = req.user;

    return await this.paymentsService.findAll({
      companyId,
      parkingLotId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      status,
    });
  }

  @Get('stats')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estadísticas de pagos',
    description: 'Retorna estadísticas agrupadas por método de pago',
  })
  @ApiQuery({ name: 'parkingLotId', required: false })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Estadísticas de pagos' })
  async getStats(
    @Query('parkingLotId') parkingLotId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
  ) {
    const { companyId } = req.user;

    return await this.paymentsService.getPaymentStats(
      companyId,
      parkingLotId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener pago por ID' })
  @ApiResponse({ status: 200, description: 'Pago encontrado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const { companyId } = req.user;
    return await this.paymentsService.findOne(id, companyId);
  }

  @Post(':id/void')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Anular pago',
    description: 'Solo SUPERVISOR/ADMIN pueden anular pagos (requiere motivo)',
  })
  @ApiResponse({ status: 200, description: 'Pago anulado' })
  @ApiResponse({ status: 400, description: 'Motivo obligatorio' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async voidPayment(
    @Param('id') id: string,
    @Body() dto: VoidReasonDto,
    @Req() req: any,
  ) {
    const { companyId, id: userId } = req.user;
    return await this.paymentsService.voidPayment(id, companyId, userId, dto.reason);
  }
}
