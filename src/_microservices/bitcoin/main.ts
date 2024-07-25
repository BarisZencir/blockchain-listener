// microservice1/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { BlockListenerModule } from './blocklistener.module';
import { DefaultLoggerService } from 'src/_common/_logger/default.logger.service';

async function bootstrap() {
    const port = parseInt(process.env.PORT);
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(BlockListenerModule, {
        transport: Transport.TCP,
        options: { port: port },
    });

    app.useLogger(app.get(DefaultLoggerService));
    app.listen();
}
bootstrap();