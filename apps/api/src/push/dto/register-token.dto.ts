import { IsIn, IsString, MinLength } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsIn(['ANDROID', 'IOS'])
  platform!: 'ANDROID' | 'IOS';
}

export class UnregisterTokenDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
