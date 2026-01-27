import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardStatsQueryDto {
  @ApiPropertyOptional({
    description: 'ID del parqueadero. Si no se especifica, usa el del usuario',
  })
  @IsOptional()
  @IsUUID()
  parkingLotId?: string;
}
