import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { User } from '../schemas/user.schema';

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

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
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' =
    'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedUsersDto {
  data: Array<Omit<User, 'password'>>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
