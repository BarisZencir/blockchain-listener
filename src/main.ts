import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DefaultLoggerService } from './_common/_logger/default.logger.service';
import * as bodyParser from 'body-parser';
import { startMicroservices } from './_microservices/microservice.manager';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });
    app.useLogger(app.get(DefaultLoggerService));

    app.use(bodyParser.json({ limit: '5mb' }));
    app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

    app.enableCors({
        origin: "*",
    })

    app.setGlobalPrefix("api/v1/");

    console.log("apiport:" + 3012)
    await app.listen(3012);

    //startMicroservices(3201);
    console.log("blocklistener started.");

}
bootstrap();
