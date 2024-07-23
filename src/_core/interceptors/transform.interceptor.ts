import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T | any;
  timestamp : string
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    // console.log("TransformInterceptor calistirildi.");
    return next.handle().pipe(map(data =>  
      ({statusCode : 200,  data : data, timestamp: new Date().toISOString()})
      ));          
  }
}
