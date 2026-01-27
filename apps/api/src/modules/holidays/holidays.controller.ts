import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Holidays')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'List holidays with optional date range filter' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Start date YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'End date YYYY-MM-DD' })
  async findAll(@Query('from') from?: string, @Query('to') to?: string) {
    return this.holidaysService.findAll(from, to);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new holiday (Admin only)' })
  async create(@Body() createDto: CreateHolidayDto) {
    return this.holidaysService.create(createDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a holiday (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.holidaysService.remove(id);
    return { message: 'Holiday deleted successfully' };
  }
}
