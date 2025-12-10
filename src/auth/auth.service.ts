/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { ObjectId } from 'mongoose';
import { RefreshTokenService } from './refreshToken.service';
import { TokenResponseDto } from './dto/tokens.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findByEmail(email);
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const userWithoutPassword: Omit<User, 'password'> =
        this.userWithoutPassword(user);
      return userWithoutPassword;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async createUser(createUserDto: CreateUserDto): Promise<TokenResponseDto> {
    const existingUser = await this.userService.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userService.create(createUserDto);

    const userWithoutPassword = this.userWithoutPassword(user);

    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user._id,
    });

    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user._id,
    );

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user._id,
    });

    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user._id,
    );

    const userWithoutPassword = this.userWithoutPassword(user);
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponseDto> {
    const tokenDoc =
      await this.refreshTokenService.validateRefreshToken(refreshToken);

    if (!tokenDoc || !tokenDoc.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findById(tokenDoc.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.jwtSecret'),
      expiresIn: this.configService.get('auth.jwtExpiresIn'),
    });

    // Generate new refresh token (rotate refresh tokens)
    const newRefreshToken = await this.refreshTokenService.rotateRefreshToken(
      refreshToken,
      user._id,
    );

    const userWithoutPassword = this.userWithoutPassword(user);
    return {
      accessToken: accessToken,
      refreshToken: newRefreshToken,
      user: userWithoutPassword,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revokeRefreshToken(refreshToken);
  }

  async logoutAll(userId: ObjectId): Promise<void> {
    await this.refreshTokenService.revokeAllUserRefreshTokens(userId);
  }

  async getProfile(userId: ObjectId): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.userWithoutPassword(user);
  }

  async validateToken(userId: ObjectId): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.userWithoutPassword(user);
  }

  userWithoutPassword(user: UserDocument): Omit<User, 'password'> {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Explicitly type the return value of toObject()
    const { password, ...userWithoutPassword } = user.toObject() as User;

    return userWithoutPassword as Omit<User, 'password'>;
  }
}
