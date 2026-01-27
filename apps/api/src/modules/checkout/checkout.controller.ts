import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CheckoutService } from './checkout.service';
import { InvoiceService } from './invoice.service';
import { CheckoutPreviewDto, CheckoutConfirmDto, VoidReasonDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { InvoiceStatus } from '../../entities/customer-invoice.entity';

@ApiTags('Checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post('preview')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Preview de checkout',
    description: 'Calcula el monto a cobrar sin realizar cambios en la base de datos',
  })
  @ApiResponse({ status: 200, description: 'Cálculo exitoso' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  @ApiResponse({ status: 409, description: 'Sesión no activa' })
  async preview(@Body() dto: CheckoutPreviewDto, @Req() req: any) {
    const { companyId, parkingLotId, id: userId } = req.user;
    return await this.checkoutService.preview(dto, companyId, parkingLotId, userId);
  }

  @Post('confirm')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Confirmar checkout',
    description:
      'Realiza el checkout completo: cierra sesión, registra pago, genera factura, libera spot',
  })
  @ApiResponse({ status: 200, description: 'Checkout exitoso' })
  @ApiResponse({ status: 400, description: 'Datos de pago inválidos' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  @ApiResponse({ status: 409, description: 'Sesión no activa' })
  async confirm(@Body() dto: CheckoutConfirmDto, @Req() req: any) {
    const { companyId, parkingLotId, id: userId } = req.user;
    return await this.checkoutService.confirm(dto, companyId, parkingLotId, userId);
  }

  @Get('invoices')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar facturas', description: 'Lista facturas con filtros' })
  @ApiQuery({ name: 'parkingLotId', required: false })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Listado de facturas' })
  async getInvoices(
    @Query('parkingLotId') parkingLotId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('status') status: InvoiceStatus,
    @Query('search') search: string,
    @Req() req: any,
  ) {
    const { companyId } = req.user;

    return await this.invoiceService.findAll({
      companyId,
      parkingLotId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      status,
      search,
    });
  }

  @Get('invoices/:id')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener factura por ID' })
  @ApiResponse({ status: 200, description: 'Factura encontrada' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async getInvoice(@Param('id') id: string, @Req() req: any) {
    const { companyId } = req.user;
    return await this.invoiceService.findOne(id, companyId);
  }

  @Post('invoices/:id/void')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Anular factura',
    description: 'Solo SUPERVISOR/ADMIN pueden anular facturas (requiere motivo)',
  })
  @ApiResponse({ status: 200, description: 'Factura anulada' })
  @ApiResponse({ status: 400, description: 'Motivo obligatorio' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async voidInvoice(
    @Param('id') id: string,
    @Body() dto: VoidReasonDto,
    @Req() req: any,
  ) {
    const { companyId, id: userId } = req.user;
    return await this.invoiceService.voidInvoice(id, companyId, userId, dto.reason);
  }

  @Get('invoices/:id/html')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener HTML imprimible de factura',
    description: 'Retorna HTML formateado listo para imprimir',
  })
  @ApiResponse({ status: 200, description: 'HTML generado', schema: { type: 'string' } })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async getInvoiceHtml(@Param('id') id: string, @Res() res: Response) {
    const html = await this.invoiceService.generateInvoiceHtml(id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Post('invoices/:id/print')
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar impresión de factura',
    description: 'Registra en AuditLog la impresión de una factura',
  })
  @ApiResponse({ status: 200, description: 'Impresión registrada' })
  async logPrint(@Param('id') id: string, @Req() req: any) {
    const { companyId, id: userId } = req.user;
    return await this.invoiceService.logPrint(id, companyId, userId);
  }
}
