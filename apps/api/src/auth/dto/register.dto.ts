import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  /** Auto-inscription réservée aux Professeurs et Parents (Ch.3.3-3.5 : Admin/SuperAdmin ne s'auto-créent jamais) */
  @IsIn(['TEACHER', 'PARENT'])
  role!: 'TEACHER' | 'PARENT';

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;

  @IsString()
  city!: string;
}
