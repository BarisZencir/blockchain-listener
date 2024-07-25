import { LoggerService, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DefaultLoggerService implements LoggerService {
    private readonly logger: winston.Logger;
    private readonly filePrefix: string;
    private readonly defaultLogLevel: string;

    constructor() {
        this.filePrefix = process.env.LOGGER_FILE_PREFIX || 'application'; // .env'den veya varsayılan değer
        this.defaultLogLevel = process.env.LOGGER_DEFAULT_LOG_LEVEL || 'info';
        this.logger = winston.createLogger({
            level: this.defaultLogLevel, // Varsayılan log seviyesini belirler
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message, context }) => {
                    return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
                }),
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    ),
                }),
                new DailyRotateFile({
                    filename: `logs/${this.filePrefix}-%DATE%.log`,
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '10d',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.printf(({ timestamp, level, message, context }) => {
                            return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
                        }),
                    ),
                }),
            ],
        });
    }

    log(message: any, context?: string) {
        this.logger.info(message, { context });
    }

    error(message: any, trace?: string, context?: string) {
        this.logger.error(message, { context });
    }

    warn(message: any, context?: string) {
        this.logger.warn(message, { context });
    }

    debug?(message: any, context?: string) {
        this.logger.debug(message, { context });
    }

    verbose?(message: any, context?: string) {
        this.logger.verbose(message, { context });
    }
}