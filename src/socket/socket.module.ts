import { Global, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { SocketService } from './socket.service';

@Global()
@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret', // use env var in production
    }),
  ],
  providers: [SocketGateway, SocketService],
  exports: [SocketGateway, SocketService],
})
export class SocketModule {}
