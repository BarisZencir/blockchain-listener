import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { Wallet } from 'ethers';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { sleep } from 'src/_common/utils/sandbox.utils';
import { Block } from 'src/block/block.model';
import { BlockService } from 'src/block/block.service';
import { AvalancheService } from 'src/networks/avalanche/avalanche.service';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionService } from 'src/transaction/transaction.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class BlockListenerService extends AvalancheService implements OnModuleInit {

    logger = new Logger(BlockListenerService.name);
    private batchSize : number;

    constructor(
        protected configService: ConfigService,
        protected readonly blockService: BlockService,
        protected readonly walletService: WalletService,
        protected readonly transactionService: TransactionService

    ) { 
        super(configService, walletService);
        this.batchSize = this.configService.get<number>("network.bitcoin.batchSize");
    }

    async onModuleInit(): Promise<void> {
        await super.initService();
    }

    async getLatestProccessedBlockNumber() : Promise<BigNumber> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.AVALANCHE,
            groupIndex : -1
        })

        if(!block) {
            return null;
        }

        return new BigNumber(block.blockNumber);
    }

    async initFirstBlock(blockNumber: BigNumber) : Promise<void> {
        let block = new Block();
        block.blockNumber = blockNumber.toString();
        block.blockchainName = BlockchainName.AVALANCHE;
        await this.blockService.save(block);
    }

    async updateBlock(blockNumber: BigNumber) : Promise<void> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.AVALANCHE,
            groupIndex : -1
        })
        block.blockNumber = blockNumber.toString();
        await this.blockService.update(block);
    }

    async processTransaction(txHash: string, transactions : Transaction[], blockNumber: BigNumber, latestBlockNumber : BigNumber) {
        const txJSON = await this.getTransaction(txHash);

        let fromWallet = await this.walletService.findByAddress(BlockchainName.AVALANCHE, txJSON.from);
        let toWallet = await this.walletService.findByAddress(BlockchainName.AVALANCHE, txJSON.to);
        txHash = txJSON.hash;
        if (fromWallet) {
            // WITHDRAW + VIRMAN
            const transaction = await this.transactionService.findByTxHash(BlockchainName.AVALANCHE, txJSON.hash);
            if (!transaction) {
                // TODO: Handle case if txDoc is null
            } else {

                transaction.state = TransactionState.COMPLATED;
                transaction.amount = txJSON.value;
                transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
                transaction.fee = new BigNumber(txJSON.gasPrice).multipliedBy(new BigNumber(txJSON.gas)).toString();
                transaction.processedBlockNumber = String(txJSON.blockNumber);
                transaction.complatedBlockNumber = blockNumber.toString();
                transactions.push(transaction);            

            }
        } else if (toWallet) {
            // DEPOSIT
            
            // toWallet.estimatedBalance = (new BigNumber(toWallet.estimatedBalance))
            //     .plus(txJSON.value).toString();

            let transaction = new Transaction();

            transaction.blockchainName = BlockchainName.AVALANCHE;
            transaction.state = TransactionState.COMPLATED;
            transaction.type = TransactionType.DEPOSIT;
            transaction.hash = txJSON.hash;
            transaction.from = txJSON.from;
            transaction.to = txJSON.to;
            transaction.amount = txJSON.value;
            transaction.fee = new BigNumber(txJSON.gasPrice).multipliedBy(new BigNumber(txJSON.gas)).toString();
            transaction.processedBlockNumber = blockNumber.toString();
            transaction.complatedBlockNumber = latestBlockNumber.toString();
            transactions.push(transaction);            

        }
    }
    
    async proccessBlock(transactions : Transaction[][], batchIndex : number, blockNumber: BigNumber, latestBlockNumber : BigNumber, retryBlock : BigNumber[], reTryCount = 0): Promise<void> {

        this.logger.debug('Avalanche block processed. blockNumber: ' + blockNumber);
        
        try {
            
            transactions[batchIndex] = new Array<Transaction>();
            const blockJSON = await this.getBlock(blockNumber);
            if (!blockJSON) {
                throw new Error(`Err1. in Avalanche processBlock. blockNumber: ${blockNumber}`);
            }

            const transactionHashList = blockJSON.transactions || [];
            for (let i = 0; i < transactionHashList.length; i += this.batchSize) {

                let batchTransactions = new Array<Transaction>();
                const currentBatch = transactionHashList.slice(i, i + this.batchSize);

                // Her işlem için bir promise oluştur
                const promises = currentBatch.map(async (txHash: string) => {

                    let hasError = false;
                    let tryCount = 0;
                    let errorMessage : string;
                    do {
                        try {
                            hasError = false;
                            await this.processTransaction(txHash, batchTransactions, blockNumber, latestBlockNumber);
                        } catch (error) {
                            hasError = true;
                            tryCount++;
                            errorMessage = error?.message || error?.toString();
                        }
        
                    } while(hasError && tryCount < 40);

                    if(hasError) {
                        let transaction = new Transaction();
                        transaction.processedBlockNumber = blockNumber.toString();
                        transaction.blockchainName = BlockchainName.AVALANCHE;
                        transaction.state = TransactionState.COMPLATED;
                        transaction.hash = txHash;
                        transaction.hasError = true;
                        transaction.error = errorMessage;
                        batchTransactions.push(transaction);  
                    }

                });

                // 'Promise.all' ile tüm promise'leri bekle
                await Promise.all(promises);
                for(const transaction of batchTransactions) {
                    transactions[batchIndex].push(transaction);
                }
            }
            
        } catch (error) {
            if(reTryCount < 4) {
                await sleep(2000);
                await this.proccessBlock(transactions, batchIndex, blockNumber, latestBlockNumber, retryBlock, reTryCount + 1);
            } else {
                retryBlock.push(blockNumber);
            }
        }
    }
}
