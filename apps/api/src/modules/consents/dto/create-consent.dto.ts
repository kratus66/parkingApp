import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import {
  ConsentChannel,
  ConsentStatus,
  ConsentSource,
} from '../../../entities/consent.entity';

export class CreateConsentDto {
  @ApiProperty({
    description: 'ID del cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Canal de comunicación',
    enum: ConsentChannel,
    example: ConsentChannel.WHATSAPP,
  })
  @IsEnum(ConsentChannel)
  @IsNotEmpty()
  channel: ConsentChannel;

  @ApiProperty({
    description: 'Estado del consentimiento',
    enum: ConsentStatus,
    example: ConsentStatus.GRANTED,
  })
  @IsEnum(ConsentStatus)
  @IsNotEmpty()
  status: ConsentStatus;

  @ApiProperty({
    description: 'Fuente del registro',
    enum: ConsentSource,
    example: ConsentSource.IN_PERSON,
  })
  @IsEnum(ConsentSource)
  @IsNotEmpty()
  source: ConsentSource;

  @ApiProperty({
    description: 'Texto de evidencia del consentimiento',
    example: 'Cliente acepta recibir mensajes por WhatsApp en taquilla',
    required: false,
  })
  @IsOptional()
  @IsString()
  evidenceText?: string;
}
