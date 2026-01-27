import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @ApiProperty({
    description:
      'Texto de búsqueda (busca en documento, nombre, teléfono, email)',
    example: 'juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    description: 'Número de página',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de resultados por página',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Campo para ordenar',
    example: 'fullName',
    required: false,
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string = 'createdAt';

  @ApiProperty({
    description: 'Orden de los resultados',
    example: 'ASC',
    required: false,
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
