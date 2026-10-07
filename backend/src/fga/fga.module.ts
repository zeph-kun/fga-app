import { Module } from '@nestjs/common';
import { FgaController } from './fga.controller';
import { FgaService } from './fga.service';
import { OpenFgaClient } from './openfga.client';

@Module({
  controllers: [FgaController],
  providers: [OpenFgaClient, FgaService],
  exports: [FgaService],
})
export class FgaModule {}
