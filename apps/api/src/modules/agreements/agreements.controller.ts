import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto, UpdateAgreementDto } from './dto/agreement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Agreements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar convenios' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'parkingLotId', required: false, type: String })
  findAll(
    @CurrentUser() user: User,
    @Query('activeOnly') activeOnly?: string,
    @Query('parkingLotId') parkingLotId?: string,
  ) {
    return this.agreementsService.findAll(user, {
      activeOnly: activeOnly === 'true',
      parkingLotId,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener convenio por ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.agreementsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Crear convenio' })
  create(@Body() dto: CreateAgreementDto, @CurrentUser() user: User) {
    return this.agreementsService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar convenio' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgreementDto,
    @CurrentUser() user: User,
  ) {
    return this.agreementsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar convenio (Admin)' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.agreementsService.remove(id, user);
    return { message: 'Convenio eliminado' };
  }
}
