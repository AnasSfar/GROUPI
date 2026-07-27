import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Ch.19.4 : publication immédiate par défaut, ou programmée (ERR-COM-007 : date requise si programmée). */
export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  scheduled?: boolean;

  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
