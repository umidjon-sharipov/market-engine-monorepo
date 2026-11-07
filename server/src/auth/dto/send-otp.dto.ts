import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendOtpDto {
  @IsString()
  @MaxLength(255)
  @IsEmail({}, { message: 'Noto‘g‘ri email formati kiritildi!' })
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak.' })
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsIn(['login', 'register'])
  intent?: 'login' | 'register';

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.' })
  @MaxLength(128)
  password?: string;
}
