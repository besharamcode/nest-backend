import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenService } from './refreshToken.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RefreshTokenSchema,
  RefreshToken,
} from './schemas/refreshToken.schema';

@Module({
  imports: [
    UserModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.get('auth.jwtExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
