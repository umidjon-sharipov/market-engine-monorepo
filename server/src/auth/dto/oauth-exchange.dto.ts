import { IsUUID } from 'class-validator';

export class OAuthExchangeDto {
  @IsUUID()
  code: string;
}
