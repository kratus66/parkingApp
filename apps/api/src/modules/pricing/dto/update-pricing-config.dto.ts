import { IsInt, IsBoolean, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePricingConfigDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty()
  @IsUUID()
  parkingLotId: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  defaultGraceMinutes?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  defaultDailyMax?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  lostTicketFee?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enableDynamicPricing?: boolean;
}
