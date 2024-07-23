import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiException } from 'src/_common/api/api.exeptions';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

  private readonly logger = new Logger(HttpExceptionFilter.name);
  constructor() { 
 
  }

  
  catch(exception: HttpException | ApiException, host: ArgumentsHost) {

    this.logger.error(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let responseBody : any;
    
    if (exception instanceof ApiException) {
      responseBody = {
        statusCode : exception.getStatus(),
        apiErrorCode : exception.getApiErrorCode(), //http exp ek olarak.
        message : exception.message,
        timestamp: new Date().toISOString(),
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

    response
      .status(responseBody.statusCode)
      .json(responseBody);
  }
}