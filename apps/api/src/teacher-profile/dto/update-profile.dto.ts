import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  /** RM-TPR-013 : disponibilités, texte libre (ex. "Lundi/Mercredi soir, weekend"). */
  @IsOptional()
  @IsString()
  availability?: string;
}
