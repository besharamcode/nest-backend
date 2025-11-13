import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || 'super-refresh-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS!) || 12,
}));
