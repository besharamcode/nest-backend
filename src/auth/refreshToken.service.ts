import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refreshToken.schema';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private model: Model<RefreshTokenDocument>,
    private configService: ConfigService,
  ) {}

  async generateRefreshToken(userId: unknown): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresIn = this.configService.get(
      'auth.refreshTokenExpiresIn',
    ) as string;

    const expiresAt = new Date();
    if (expiresIn.endsWith('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    } else if (expiresIn.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));
    }

    await this.model.create({
      token,
      userId,
      expiresAt,
      isActive: true,
    });

    return token;
  }

  async validateRefreshToken(
    token: string,
  ): Promise<RefreshTokenDocument | null> {
    const refreshToken = await this.model.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    return refreshToken;
  }

  async rotateRefreshToken(oldToken: string, userId: unknown): Promise<string> {
    // Revoke the old token
    await this.revokeRefreshToken(oldToken);

    // Generate a new token
    return this.generateRefreshToken(userId);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.model.updateOne({ token }, { isActive: false });
  }

  async revokeAllUserRefreshTokens(userId: ObjectId): Promise<void> {
    await this.model.updateMany(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.model.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }
}
