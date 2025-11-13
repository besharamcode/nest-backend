import 'socket.io';

declare module 'socket.io' {
  interface Socket {
    user?: {
      sub: string;
    };
  }
}
