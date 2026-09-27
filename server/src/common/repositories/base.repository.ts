import { NotFoundException } from '@nestjs/common';

/**
 * Prisma model delegate uchun kichik, umumiy CRUD contract.
 * Concrete repository delegate'ni PrismaService'dan beradi.
 */
export interface RepositoryDelegate<TEntity> {
  findMany(args?: unknown): Promise<TEntity[]>;
  findUnique(args: unknown): Promise<TEntity | null>;
  create(args: unknown): Promise<TEntity>;
  update(args: unknown): Promise<TEntity>;
  delete(args: unknown): Promise<TEntity>;
}

export abstract class BaseRepository<
  TEntity,
  TWhereUnique = unknown,
  TFindManyArgs = unknown,
> {
  protected constructor(
    protected readonly delegate: RepositoryDelegate<TEntity>,
  ) {}

  findAll(args?: TFindManyArgs): Promise<TEntity[]> {
    return this.delegate.findMany(args);
  }

  async findOne(where: TWhereUnique): Promise<TEntity> {
    const entity = await this.delegate.findUnique({ where });
    if (!entity) {
      throw new NotFoundException('Requested resource was not found');
    }
    return entity;
  }

  create<TCreateInput>(data: TCreateInput): Promise<TEntity> {
    return this.delegate.create({ data });
  }

  update<TUpdateInput>(
    where: TWhereUnique,
    data: TUpdateInput,
  ): Promise<TEntity> {
    return this.delegate.update({ where, data });
  }

  delete(where: TWhereUnique): Promise<TEntity> {
    return this.delegate.delete({ where });
  }
}
