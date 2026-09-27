import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: 'DATABASE_POOL',
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) => databaseService.pool,
    },
  ],
  exports: [DatabaseService, 'DATABASE_POOL'],
})
export class DatabaseModule {}
