import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';
import { SocketService } from './socket.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:5173',
    ], // your frontend URL
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly socketService: SocketService,
  ) {}

  afterInit() {
    // Register the server globally for other modules
    this.socketService.setServer(this.server);
  }

  async handleConnection(client: Socket) {
    // get token from handshake query or headers
    const token = client.handshake.auth?.token as string;
    if (!token) {
      client.disconnect();
      return;
    }

    // verify token
    try {
      const payload: { sub: string } = this.jwtService.verify(String(token));
      client.user = payload;
      await this.userService.update(payload.sub, {
        online: true,
        socketId: client.id,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'jwt expired') {
          console.log('Token expired');
        } else {
          console.log('JWT Error:', error.message);
        }
      } else {
        console.log('Unknown error:', error);
      }
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Example event handler
  @SubscribeMessage('send_message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string },
  ) {
    // Broadcast to all connected clients
    this.server.emit('receive_message', {
      sender: client.id,
      ...payload,
    });
  }
}
