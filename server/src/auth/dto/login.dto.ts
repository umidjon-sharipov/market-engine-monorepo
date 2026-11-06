import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Noto‘g‘ri email formati kiritildi!' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.' })
  @MaxLength(128)
  password: string;
}
