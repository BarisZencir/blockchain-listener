import { Module } from '@nestjs/common';
import { DefaultLoggerService } from './default.logger.service';

@Module({
    providers: [DefaultLoggerService],
    exports: [DefaultLoggerService],
})
export class DefaultLoggerModule { }