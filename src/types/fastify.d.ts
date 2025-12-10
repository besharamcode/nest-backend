import 'fastify';
import { ObjectId } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      _id: ObjectId;
    } & User; // You can replace `any` with your own JWT payload interface
  }
}
