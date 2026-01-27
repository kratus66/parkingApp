import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelTicketDto {
  @ApiProperty({
    description: 'Razón de cancelación',
    example: 'Error en el registro',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
