import { IsUUID, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({
    description: 'ID del parqueadero',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  parkingLotId: string;

  @ApiProperty({
    description: 'Base inicial en COP',
    example: 50000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  openingFloat: number;

  @ApiPropertyOptional({
    description: 'Notas de apertura',
    example: 'Turno mañana - Base completa',
  })
  @IsOptional()
  @IsString()
  openingNotes?: string;
}

export class CloseShiftDto {
  @ApiPropertyOptional({
    description: 'Notas de cierre',
    example: 'Todo correcto - Sin novedades',
  })
  @IsOptional()
  @IsString()
  closingNotes?: string;
}
