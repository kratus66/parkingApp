import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParkingLotsService } from './parking-lots.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Parking Lots')
@Controller('parking-lots')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ParkingLotsController {
  constructor(private readonly parkingLotsService: ParkingLotsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all parking lots' })
  findAll(@GetUser('companyId') companyId: string) {
    return this.parkingLotsService.findAll(companyId);
  }
}
