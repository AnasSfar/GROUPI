import { IsString, MinLength } from 'class-validator';

export class RejectSituationDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
