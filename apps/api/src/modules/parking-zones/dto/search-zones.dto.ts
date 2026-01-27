import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchZonesDto {
  @ApiProperty({
    description: 'ID del parqueadero para filtrar zonas',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  parkingLotId?: string;

  @ApiProperty({
    description: 'Término de búsqueda (busca en name y description)',
    required: false,
    example: 'zona a',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Página actual',
    required: false,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de registros por página',
    required: false,
    default: 20,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
