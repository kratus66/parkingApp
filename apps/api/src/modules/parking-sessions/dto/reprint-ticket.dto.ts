import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReprintTicketDto {
  @ApiProperty({ description: 'ID de la sesión de parking' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Motivo de la reimpresión' })
  @IsOptional()
  @IsString()
  reason?: string;
}
