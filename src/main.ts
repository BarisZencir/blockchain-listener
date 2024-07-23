import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DefaultLoggerService } from './_common/_logger/default.logger.service';
import * as bodyParser from 'body-parser';
import { startMicroservices } from './_microservices/microservice.manager';
import { AllExceptionsFilter } from './_core/filters/all-exception.filter';
import { ValidationPipe } from './_core/pipes/validation.pipe';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
        cors: true
    });
    app.useLogger(app.get(DefaultLoggerService));

    app.use(bodyParser.json({ limit: '5mb' }));
    app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

    const httpAdapter = app.get(HttpAdapterHost);

    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    app.useGlobalPipes(new ValidationPipe());
  
    app.use(bodyParser.json({ limit: '5mb' }));
    app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
  
    app.enableCors({ 
        origin: "*",
      })

    app.setGlobalPrefix("api/v1/");

    console.log("apiport:" + 3032)
    await app.listen(3032);

    startMicroservices(3301);
    console.log("blocklistener started.");

}
bootstrap();
