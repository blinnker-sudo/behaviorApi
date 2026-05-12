import { IsOptional, IsString } from 'class-validator';

export class DataDto {
  @IsString()
  public name!: string;

  @IsOptional()
  @IsString()
  public correlationId?: string;
}
