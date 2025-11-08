import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ObjectId } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const user = await this.model.create(createUserDto);
    return user;
  }

  async findAll() {
    const users = await this.model.find().exec();
    return users;
  }

  async findOne(query: FilterQuery<UserDocument>) {
    return this.model.findOne(query).exec();
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }

  async findById(id: ObjectId) {
    const user = await this.model.findById(id);
    return user;
  }

  async update(id: ObjectId, updateUserDto: UpdateUserDto) {
    const user = await this.model.findByIdAndUpdate(id, updateUserDto);
    return user;
  }

  async remove(id: ObjectId) {
    const user = await this.model.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    user.deleted = true;
    await user.save();
    return true;
  }
}
