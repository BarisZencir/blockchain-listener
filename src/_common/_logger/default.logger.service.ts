import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class DefaultLoggerService implements LoggerService {
    log(message: any, context?: string, ...optionalParams: any[]) {
        console.log(`[${context || 'Application'}] ${message}`, ...optionalParams);
    }

    fatal(message: any, context?: string, ...optionalParams: any[]) {
        console.error(`[${context || 'Application'}] ${message}`, ...optionalParams);
    }

    error(message: any, context?: string, ...optionalParams: any[]) {
        console.error(`[${context || 'Application'}] ${message}`, ...optionalParams);
    }

    warn(message: any, context?: string, ...optionalParams: any[]) {
        console.warn(`[${context || 'Application'}] ${message}`, ...optionalParams);
    }

    debug?(message: any, context?: string, ...optionalParams: any[]) {
        console.debug(`[${context || 'Application'}] ${message}`, ...optionalParams);
    }

    verbose?(message: any, context?: string, ...optionalParams: any[]) {
        console.log(`[${context || 'Application'}] ${message}`, ...optionalParams);
    }
}