import { IsEmail, IsString, MinLength } from 'class-validator';
import { User } from '../schemas/user.schema';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(4)
  firstName?: string;

  @IsString()
  @MinLength(4)
  lastName?: string;

  socketId?: string;

  online?: boolean;
}

export class UserDTO {
  email: string;
  firstName: string;
  lastName: string;
  socketId?: string;
  online?: boolean;
  createdAt: Date;
  updatedAt: Date;
  constructor(user: User) {
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.socketId = user.socketId;
    this.online = user.online;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
