import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Noto‘g‘ri email formati!' })
  @MaxLength(255)
  email: string;

  @IsString()
  @Length(6, 6, {
    message: 'Tasdiqlash kodi 6 ta belgidan iborat bo‘lishi shart!',
  })
  @Matches(/^[0-9]+$/, {
    message: 'Kod faqat raqamlardan iborat bo‘lishi kerak!',
  })
  code: string;
}
