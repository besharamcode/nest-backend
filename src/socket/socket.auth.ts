import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

export class SocketAuth {
  constructor(private readonly jwtService: JwtService) {}

  verifyToken(token?: string) {
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const decoded = this.jwtService.verify(token) as unknown as {
        sub: string;
      };
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
