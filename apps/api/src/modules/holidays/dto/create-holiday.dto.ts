import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({ example: 'CO', description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsString()
  @Length(2, 2)
  country: string = 'CO';

  @ApiProperty({ example: '2026-01-01', description: 'Holiday date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in format YYYY-MM-DD',
  })
  date: string;

  @ApiProperty({ example: 'Año Nuevo', description: 'Holiday name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
