import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { GetUsersQueryDto } from './dto/list-users.dto';
import {
  buildPaginationMeta,
  normalizePagination,
  PaginatedResponse,
} from 'src/common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const user = await this.model.create(createUserDto);
    return user;
  }

  async findAll(
    query: GetUsersQueryDto,
  ): Promise<PaginatedResponse<Omit<User, 'password'>>> {
    const {
      search,
      includeDeleted = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const { page, limit, skip } = normalizePagination(query);

    const filter: FilterQuery<UserDocument> = includeDeleted
      ? {}
      : { deleted: { $ne: true } };

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { email: regex },
        { firstName: regex },
        { lastName: regex },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      this.model
        .find(filter)
        .select('-password -__v')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data: users as Array<Omit<User, 'password'>>,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findOne(query: FilterQuery<UserDocument>) {
    return this.model.findOne(query).exec();
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }

  async findById(id: string) {
    const user = await this.model.findById(id);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.model.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });
    return user;
  }

  async remove(id: string) {
    const user = await this.model.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    user.deleted = true;
    await user.save();
    return true;
  }
}
