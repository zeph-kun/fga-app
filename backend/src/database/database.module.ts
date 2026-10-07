import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SchemaService } from './schema.service';

@Global()
@Module({
  providers: [PrismaService, SchemaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
