import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly pool: Pool;

  constructor(configService: ConfigService) {
    this.pool = new Pool({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
      max: configService.get<number>('DB_POOL_MAX', 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: {
        rejectUnauthorized: configService.get('NODE_ENV') === 'production',
      },
    });
  }

  async query(text: string, params?: unknown[]) {
    return this.pool.query(text, params as any[] | undefined);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
