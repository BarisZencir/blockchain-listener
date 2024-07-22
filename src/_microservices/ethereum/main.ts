// microservice1/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { BlockListenerModule } from './blocklistener.module';

async function bootstrap() {
    const port = parseInt(process.env.PORT);
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(BlockListenerModule, {
        transport: Transport.TCP,
        options: { port: port },
    });
    app.listen();
}
bootstrap();