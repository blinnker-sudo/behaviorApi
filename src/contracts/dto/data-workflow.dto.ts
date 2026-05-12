import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataDto } from './data.dto';

export class DataWorkflowDto {
  @IsString()
  public flow!: string;

  @IsString()
  public requestId!: string;

  @IsOptional()
  @IsString()
  public correlationId?: string;

  @IsOptional()
  @IsNumber()
  public attempts?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataDto)
  public data?: DataDto;
}
