import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { DocumentType } from '../../../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: DocumentType.CC,
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @ApiProperty({
    description: 'Número de documento (sin puntos ni espacios)',
    example: '1234567890',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  documentNumber: string;

  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez González',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+57 300 1234567',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[\d\s\-\+\(\)]+$/, {
    message: 'El teléfono solo puede contener números, espacios y símbolos + - ( )',
  })
  phone?: string;

  @ApiProperty({
    description: 'Email de contacto',
    example: 'juan.perez@email.com',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Calle 123 #45-67',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Notas adicionales',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
