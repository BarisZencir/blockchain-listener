import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, Interval } from '@nestjs/schedule';
import { BlockListenerService } from './blocklistener.service';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { Block } from 'src/block/block.model';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { TransactionService } from 'src/transaction/transaction.service';
import { Transaction } from 'src/transaction/transaction.model';

@Injectable()
export class BlockListenerScheduler implements OnModuleInit {
    private readonly logger = new Logger(BlockListenerScheduler.name);
    private currentBlockNumber : BigNumber;
    private blockGap : BigNumber;
    private batchLimit : number;
    private lock : boolean;
    constructor(
        private configService: ConfigService,
        private readonly blockListenerService: BlockListenerService,
        protected readonly transactionService: TransactionService

    ) { 
        this.currentBlockNumber = null;
        this.lock = true;
    }

    async onModuleInit(): Promise<void> {
        this.blockGap = this.configService.get<BigNumber>("network.tron.blockGap");            
        this.currentBlockNumber = this.configService.get<BigNumber>("network.tron.starterBlockNumber");
        this.batchLimit = this.configService.get<number>("network.tron.batchLimit");
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
        const transactionsForUpdate: Transaction[] = [];
        const transactionsForSave: Transaction[] = [];

        try {

            if(this.currentBlockNumber == null) {
                return;
            }
    
            let liveBlockNumber = await this.blockListenerService.getBlockNumber();
            let blockNumberDiff = liveBlockNumber.minus(this.blockGap).minus(this.currentBlockNumber);
            if(blockNumberDiff.lte(0)){
                return;
            }

            let batchSize = this.batchLimit;
            if(blockNumberDiff.lt(batchSize)) {
                batchSize = blockNumberDiff.toNumber();
            }
            
            let promises = [];
            let nextBlockNumber = this.currentBlockNumber;
            
            let transactionArray2D: Transaction[][] = Array.from({ length: batchSize }, () => []);

            for (let i = 0; i < batchSize; i++) {
                nextBlockNumber = nextBlockNumber.plus(1);
                promises.push(this.blockListenerService.proccessBlock(transactionArray2D, i, nextBlockNumber, liveBlockNumber));
            }
            await Promise.all(promises); // 20 bloğu toplu olarak işle
            this.currentBlockNumber = nextBlockNumber; 

            // Tek boyutlu array'e dönüştürme
            for (let i = 0; i < transactionArray2D.length; i++) {
                for (let j = 0; j < transactionArray2D[i].length; j++) {
                    const item = transactionArray2D[i][j];
                    if (item !== null) {
                        if(item.id) {
                            transactionsForUpdate.push(item);
                        } else {
                            transactionsForSave.push(item);
                        }
                    }
                }
            }

            await Promise.all(transactionsForSave.map(transaction => this.transactionService.save(transaction) ));
            await Promise.all(transactionsForUpdate.map(transaction => this.transactionService.update(transaction) ));
            await this.blockListenerService.updateBlock(this.currentBlockNumber);

        } catch(error) {
            this.logger.error(error);
        } finally {
            this.lock = false;
        }
    }
}
