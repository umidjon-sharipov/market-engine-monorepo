import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.' })
  @MaxLength(128)
  password: string;
}
