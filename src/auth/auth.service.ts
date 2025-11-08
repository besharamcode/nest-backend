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
import { User } from '../user/schemas/user.schema';
import { ObjectId } from 'mongoose';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const { ...result } = user.toObject();
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    const existingUser = await this.userService.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.configService.get('auth.bcryptRounds') || 12,
    );

    const user = await this.userService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const { ...userWithoutPassword } = user.toObject();
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user._id,
    } as JwtPayload);

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
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

    const { ...userWithoutPassword } = user.toObject();
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user._id,
    } as JwtPayload);

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async getProfile(userId: ObjectId): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async validateToken(userId: ObjectId): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}
