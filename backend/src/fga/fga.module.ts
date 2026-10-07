import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FgaController } from './fga.controller';
import { FgaService } from './fga.service';
import { FgaEngine } from './engine';
import { FGA_CONFIG } from './config';
import { PgTupleRepository } from './pg-repository';
import { NamespaceConfig, TUPLE_REPOSITORY, TupleRepository } from './model';

@Module({
  imports: [DatabaseModule],
  controllers: [FgaController],
  providers: [
    { provide: 'NAMESPACE_CONFIG', useValue: FGA_CONFIG as NamespaceConfig },
    { provide: TUPLE_REPOSITORY, useClass: PgTupleRepository },
    {
      provide: FgaEngine,
      useFactory: (repo: TupleRepository, config: NamespaceConfig) => new FgaEngine(repo, config),
      inject: [TUPLE_REPOSITORY, 'NAMESPACE_CONFIG'],
    },
    FgaService,
  ],
  exports: [FgaService, TUPLE_REPOSITORY],
})
export class FgaModule {}
