import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CancelSessionDto {
  @ApiProperty({ description: 'ID de la sesión a cancelar' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Motivo de la cancelación' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Nombre del dispositivo' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
