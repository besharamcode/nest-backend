import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { GetUsersQueryDto, PaginatedUsersDto } from './dto/list-users.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const user = await this.model.create(createUserDto);
    return user;
  }

  async findAll(query: GetUsersQueryDto): Promise<PaginatedUsersDto> {
    const {
      page = 1,
      limit = 10,
      search,
      includeDeleted = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
    const pageSize =
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
    const skip = (currentPage - 1) * pageSize;

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
        .limit(pageSize)
        .lean()
        .exec(),
      this.model.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return {
      data: users as Array<Omit<User, 'password'>>,
      meta: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
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
