import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @MaxLength(255)
  @IsEmail({}, { message: 'Noto‘g‘ri email formati kiritildi!' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.' })
  @MaxLength(128)
  password?: string;
}
