import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, Interval } from '@nestjs/schedule';

@Injectable()
export class AppTasksService {
    private readonly logger = new Logger(AppTasksService.name);

    @Interval(10000)
    handleCron() {
        this.logger.debug('Called every 10 seconds');
    }
}
