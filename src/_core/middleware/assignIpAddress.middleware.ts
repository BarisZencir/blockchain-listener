import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class AssignIpAddressMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // console.log("Assigning Ip Address.");
    const forwarded = req.headers['x-forwarded-for'];
    req.ipAddress = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
    next();
  }
}
