import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server: Server | null = null;

  // Called by the gateway after init
  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(userId).emit(event, data);
  }

  broadcast(event: string, data: any) {
    if (!this.server) return;
    this.server.emit(event, data);
  }

  emitToSocket(socketId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(socketId).emit(event, data);
  }
}
