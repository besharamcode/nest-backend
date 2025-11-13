import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import {
  PaginatedResponse,
  PaginationQueryDto,
} from 'src/common/dto/pagination.dto';
import { User } from '../schemas/user.schema';

export class GetUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value),
  )
  @IsBoolean()
  includeDeleted?: boolean = false;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'])
  sortBy: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' =
    'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export type PaginatedUsersDto = PaginatedResponse<Omit<User, 'password'>>;
