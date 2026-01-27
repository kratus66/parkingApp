import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketTemplatesService } from './ticket-templates.service';
import { CreateTicketTemplateDto } from './dto/create-ticket-template.dto';
import { UpdateTicketTemplateDto } from './dto/update-ticket-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('TicketTemplates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ticket-templates')
export class TicketTemplatesController {
  constructor(private readonly ticketTemplatesService: TicketTemplatesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Crear plantilla de ticket' })
  @ApiResponse({ status: 201, description: 'Plantilla creada exitosamente' })
  create(@Body() createDto: CreateTicketTemplateDto, @CurrentUser() user: User) {
    return this.ticketTemplatesService.create(user.companyId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener plantillas de ticket' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas' })
  findAll(@Query('parkingLotId') parkingLotId: string) {
    return this.ticketTemplatesService.findAll(parkingLotId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla encontrada' })
  findOne(@Param('id') id: string) {
    return this.ticketTemplatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar plantilla' })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTicketTemplateDto) {
    return this.ticketTemplatesService.update(id, updateDto);
  }

  @Post(':id/set-default')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Establecer plantilla como predeterminada' })
  @ApiResponse({ status: 200, description: 'Plantilla establecida como predeterminada' })
  setDefault(@Param('id') id: string) {
    return this.ticketTemplatesService.setDefault(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Eliminar plantilla' })
  @ApiResponse({ status: 200, description: 'Plantilla eliminada' })
  remove(@Param('id') id: string) {
    return this.ticketTemplatesService.remove(id);
  }
}