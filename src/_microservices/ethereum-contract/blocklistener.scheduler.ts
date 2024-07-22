import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, Interval } from '@nestjs/schedule';
import { BlockListenerService } from './blocklistener.service';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { Block } from 'src/block/block.model';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';

@Injectable()
export class BlockListenerScheduler implements OnModuleInit {
    private readonly logger = new Logger(BlockListenerScheduler.name);
    private currentBlockNumber : BigNumber;
    private blockGap : BigNumber;
    private lock : boolean;
    constructor(
        private configService: ConfigService,
        private readonly blockListenerService: BlockListenerService
    ) { 
        this.currentBlockNumber = null;
        this.lock = true;
    }

    async onModuleInit(): Promise<void> {
        this.blockGap = this.configService.get<BigNumber>("network.ethereum.blockGap");            
        this.currentBlockNumber = this.configService.get<BigNumber>("network.ethereum.starterBlockNumber");    
        await this.blockListenerService.initService();                 
        let latestProcessedBlockNumber = await this.blockListenerService.getLatestProccessedBlockNumber();
        if(latestProcessedBlockNumber) {
            if(this.currentBlockNumber.isLessThan(latestProcessedBlockNumber)) {
                this.currentBlockNumber = latestProcessedBlockNumber;
            }
        } else {
            await this.blockListenerService.initFirstBlock(this.currentBlockNumber);
        }

        this.lock = false;
    }

    @Interval(200)
    async handleCron() {

        if(this.lock) {
            return;
        }
        this.lock = true;
        try {

            if(this.currentBlockNumber == null) {
                return;
            }
    
            let liveBlockNumber = await this.blockListenerService.getBlockNumber();
            if(liveBlockNumber.minus(this.blockGap).lte(this.currentBlockNumber)) {
                return;
            }
    
            let nextBlockNumber = this.currentBlockNumber.plus(1);
            let hasTransaction = await this.blockListenerService.proccessBlock(nextBlockNumber, liveBlockNumber);
            //hasTransaction : belki broadcast vs ekleriz.

            this.currentBlockNumber = nextBlockNumber;
        } catch(error) {
            this.logger.error(error);
        } finally {
            this.lock = false;
        }
    }
}
