import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // The frontend runs in the browser and calls the API via localhost:3001.
  app.enableCors({ origin: true, credentials: false });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
