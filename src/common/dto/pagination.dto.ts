import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}

export class PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMetaDto;
}

export function normalizePagination(query: PaginationQueryDto): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const limit =
    Number.isFinite(query.limit) && query.limit > 0
      ? Math.min(query.limit, 100)
      : 10;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMetaDto {
  const safeLimit = limit > 0 ? limit : 10;
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);

  return {
    total,
    page,
    limit: safeLimit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
