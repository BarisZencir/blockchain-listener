// microservice1/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { BlockListenerModule } from './blocklistener.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(BlockListenerModule, {
    transport: Transport.TCP,
    options: { port: 3001 },
  });
  app.listen();
}
bootstrap();