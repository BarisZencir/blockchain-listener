import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if(request.ipAddress && request.ipAddress.replace) {
      return request.ipAddress.replace(/((?::))(?:[0-9]+)$/, "");
    }

    return request.ipAddress;
  },
);