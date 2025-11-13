import 'fastify';
import { User } from 'src/user/schemas/user.schema';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      _id: string;
    } & User; // You can replace `any` with your own JWT payload interface
  }
}
