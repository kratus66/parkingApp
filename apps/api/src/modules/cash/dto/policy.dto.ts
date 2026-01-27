import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePolicyDto {
  @ApiPropertyOptional({
    description: 'Exigir turno abierto para checkout',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  requireOpenShiftForCheckout?: boolean;

  @ApiPropertyOptional({
    description: 'Duración default del turno en horas',
    example: 8,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultShiftHours?: number;

  @ApiPropertyOptional({
    description: 'Permitir múltiples turnos abiertos por cajero',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allowMultipleOpenShiftsPerCashier?: boolean;

  @ApiPropertyOptional({
    description: 'Permitir múltiples turnos abiertos en el mismo parqueadero',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowMultipleOpenShiftsPerParkingLot?: boolean;
}
