import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiException } from 'src/_common/api/api.exeptions';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) { 
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    
    this.logger.error(exception);
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let responseBody : any;
    
    if (exception instanceof ApiException) {
      responseBody = {
        statusCode : exception.getStatus(),
        apiErrorCode : exception.getApiErrorCode(), //http exp ek olarak.
        message : exception.message,
        timestamp: new Date().toISOString()
      };
    } else if(exception instanceof HttpException) {
      responseBody = {
        statusCode : exception.getStatus(),
        message : exception.message,
        timestamp: new Date().toISOString()
      };  
    } else {
      responseBody = {
        statusCode : HttpStatus.INTERNAL_SERVER_ERROR,
        message : "Internal Server Error",
        timestamp: new Date().toISOString()
      };        
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, responseBody.statusCode);
  }
}
