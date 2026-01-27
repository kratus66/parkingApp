import { IsUUID, IsString, IsBoolean, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketTemplateDto {
  @ApiProperty({ description: 'ID del parqueadero' })
  @IsUUID()
  parkingLotId: string;

  @ApiProperty({ description: 'Nombre de la plantilla' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Líneas del encabezado', type: [String] })
  @IsArray()
  @IsString({ each: true })
  headerLines: string[];

  @ApiProperty({ description: 'Líneas del pie de página', type: [String] })
  @IsArray()
  @IsString({ each: true })
  footerLines: string[];

  @ApiPropertyOptional({ description: 'Mostrar código QR', default: true })
  @IsOptional()
  @IsBoolean()
  showQr?: boolean;

  @ApiPropertyOptional({ description: 'Es plantilla por defecto', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
