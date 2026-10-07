import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
  }

  async query<Row extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<QueryResult<Row>> {
    try {
      return await this.pool.query<Row>(sql, params);
    } catch (error) {
      this.logger.error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
