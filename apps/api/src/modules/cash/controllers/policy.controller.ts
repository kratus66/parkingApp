import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { PolicyService } from '../services/policy.service';
import { UpdatePolicyDto } from '../dto/policy.dto';

@ApiTags('CashPolicy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash/policy')
export class PolicyController {
  constructor(private policyService: PolicyService) {}

  @Get()
  @Roles(UserRole.CASHIER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener política de caja del parqueadero' })
  @ApiQuery({
    name: 'parkingLotId',
    required: true,
    description: 'ID del parqueadero',
  })
  @ApiResponse({
    status: 200,
    description: 'Política de caja (null si no existe)',
  })
  async getPolicy(@Query('parkingLotId') parkingLotId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return await this.policyService.getPolicy(parkingLotId, companyId);
  }

  @Put()
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Crear/actualizar política de caja (upsert, requiere SUPERVISOR)',
  })
  @ApiQuery({
    name: 'parkingLotId',
    required: true,
    description: 'ID del parqueadero',
  })
  @ApiResponse({
    status: 200,
    description: 'Política guardada',
  })
  async upsertPolicy(
    @Query('parkingLotId') parkingLotId: string,
    @Body() dto: UpdatePolicyDto,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    const userId = req.user.id;
    return await this.policyService.upsertPolicy(parkingLotId, companyId, dto, userId);
  }
}
