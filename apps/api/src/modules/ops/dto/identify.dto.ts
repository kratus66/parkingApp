import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, ValidateIf } from 'class-validator';
import { DocumentType } from '../../../entities/customer.entity';

export class IdentifyDto {
  @ApiProperty({
    description: 'Placa del vehículo',
    example: 'ABC123',
    required: false,
  })
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @ApiProperty({
    description: 'Código de bicicleta',
    example: 'BICI-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  bicycleCode?: string;

  @ApiProperty({
    description: 'Tipo de documento del cliente',
    enum: DocumentType,
    required: false,
  })
  @ValidateIf((o) => o.documentNumber)
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiProperty({
    description: 'Número de documento del cliente',
    example: '1234567890',
    required: false,
  })
  @ValidateIf((o) => o.documentType)
  @IsString()
  documentNumber?: string;
}
