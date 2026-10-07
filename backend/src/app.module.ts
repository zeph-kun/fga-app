import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { DirectoryModule } from './directory/directory.module';
import { DocumentsModule } from './documents/documents.module';
import { FgaModule } from './fga/fga.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [DatabaseModule, FgaModule, DirectoryModule, DocumentsModule],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
