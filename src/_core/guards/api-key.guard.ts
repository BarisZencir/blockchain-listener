import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    private validApiKey = "";

    constructor() {

        const args = process.argv.slice(2);        
        args.forEach((arg) => {
        const [key, value] = arg.split('=');
            if (key === '--X_API_KEY') {
                this.validApiKey = value;
            }
        });
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (apiKey === this.validApiKey) {
            return true;
        }

        throw new UnauthorizedException('Invalid API key');
    }
}