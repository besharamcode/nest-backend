import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: any; // You can replace `any` with your own JWT payload interface
  }
}
