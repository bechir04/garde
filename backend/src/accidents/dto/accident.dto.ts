import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min, Matches } from 'class-validator';

export class CreateAccidentDto {
  @IsDateString()
  @IsNotEmpty()
  accidentDate: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'الوقت يجب أن يكون بصيغة HH:MM' })
  accidentTime: string;

  @IsInt()
  @IsNotEmpty()
  governorateId: number;

  @IsInt()
  @IsOptional()
  cityId?: number;

  @IsString()
  @IsOptional()
  route?: string;

  @IsOptional()
  kilometrePoint?: number;

  @IsInt()
  @IsNotEmpty()
  causeId: number;

  @IsInt()
  @IsOptional()
  vehicleBrand1Id?: number;

  @IsInt()
  @IsOptional()
  vehicleBrand2Id?: number;

  @IsInt()
  @Min(0)
  deathsCount: number;

  @IsInt()
  @Min(0)
  injuriesCount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAccidentDto {
  @IsDateString()
  @IsOptional()
  accidentDate?: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'الوقت يجب أن يكون بصيغة HH:MM' })
  @IsOptional()
  accidentTime?: string;

  @IsInt()
  @IsOptional()
  governorateId?: number;

  @IsInt()
  @IsOptional()
  cityId?: number;

  @IsString()
  @IsOptional()
  route?: string;

  @IsOptional()
  kilometrePoint?: number;

  @IsInt()
  @IsOptional()
  causeId?: number;

  @IsInt()
  @IsOptional()
  vehicleBrand1Id?: number;

  @IsInt()
  @IsOptional()
  vehicleBrand2Id?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  deathsCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  injuriesCount?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AccidentQueryDto {
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  governorateId?: number;

  @IsOptional()
  @IsInt()
  causeId?: number;

  @IsOptional()
  @IsInt()
  brandId?: number;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'accidentDate';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
