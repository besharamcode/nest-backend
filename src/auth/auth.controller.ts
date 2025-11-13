import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto, UserDTO } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import type { FastifyRequest } from 'fastify';
import { RefreshTokenDto, TokenResponseDto } from './dto/tokens.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<TokenResponseDto> {
    return this.authService.createUser(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refresh(
    @Headers() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshtoken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Headers() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    await this.authService.logout(refreshTokenDto.refreshtoken);
    return { message: 'Logout successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logoutall')
  async logoutAll(
    @Request() req: FastifyRequest,
  ): Promise<{ message: string }> {
    if (req.user && req.user?._id)
      await this.authService.logoutAll(req.user?._id);
    else return { message: 'User not found' };
    return { message: 'Logged out from all devices' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: FastifyRequest): UserDTO {
    return req.user as UserDTO;
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  validateToken(@Request() req: FastifyRequest): UserDTO {
    return req.user as UserDTO;
  }
}
