import { Injectable, Logger, OnModuleInit} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, Interval } from '@nestjs/schedule';
import { BlockListenerService } from './blocklistener.service';

@Injectable()
export class BlockListenerScheduler implements OnModuleInit{
  private readonly logger = new Logger(BlockListenerScheduler.name);


  constructor(
    private readonly blockListener : BlockListenerService
  ) {}

  async onModuleInit() : Promise<void> {

  }

  @Interval(10000)
  handleCron() {
    this.logger.debug('Called every 10 seconds');
  }
}
