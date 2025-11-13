import { IsString } from 'class-validator';
import { User } from 'src/user/schemas/user.schema';

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

export class RefreshTokenDto {
  @IsString()
  refreshtoken: string;
}
