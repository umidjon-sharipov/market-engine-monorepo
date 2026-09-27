import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @MaxLength(255)
  @IsEmail({}, { message: 'Noto‘g‘ri email formati kiritildi!' })
  email: string;
}
