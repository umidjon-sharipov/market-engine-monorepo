import { BaseRepository, RepositoryDelegate } from '../repositories/base.repository';

export type { RepositoryDelegate } from '../repositories/base.repository';

/**
 * Service layer uchun BaseRepository alias.
 * Domain-specific service'lar kerak bo'lsa shu class'dan meros oladi.
 */
export abstract class BaseCrudService<
  TEntity,
  TWhereUnique = unknown,
  TFindManyArgs = unknown,
> extends BaseRepository<TEntity, TWhereUnique, TFindManyArgs> {
  protected constructor(delegate: RepositoryDelegate<TEntity>) {
    super(delegate);
  }
}
