import { IsString, MinLength } from 'class-validator';

export class RejectSchoolAdditionRequestDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}