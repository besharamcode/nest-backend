import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigurationModule } from './config/config.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ConfigurationModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('database.uri'),
      }),
      inject: [ConfigService],
    }),
    CloudinaryModule,
    SocketModule,
  ],
})
export class AppModule {}
