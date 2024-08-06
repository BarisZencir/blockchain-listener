import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { Wallet } from 'ethers';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { sleep } from 'src/_common/utils/sandbox.utils';
import { Block } from 'src/block/block.model';
import { BlockService } from 'src/block/block.service';
import { TronService } from 'src/networks/tron/tron.service';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionService } from 'src/transaction/transaction.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class BlockListenerService extends TronService implements OnModuleInit {

    logger = new Logger(BlockListenerService.name);
    private batchSize : number;
    constructor(
        protected configService: ConfigService,
        protected readonly blockService: BlockService,
        protected readonly walletService: WalletService,
        protected readonly transactionService: TransactionService
        
    ) { 
        super(configService, walletService);
        this.batchSize = this.configService.get<number>("network.tron.batchSize");
    }

    async onModuleInit(): Promise<void> {
        await super.initService();
    }

    async getLatestProccessedBlockNumber() : Promise<BigNumber> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.TRON,
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
        block.blockchainName = BlockchainName.TRON;
        await this.blockService.save(block);
    }

    async updateBlock(blockNumber: BigNumber) : Promise<void> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.TRON,
            groupIndex : -1
        })
        block.blockNumber = blockNumber.toString();
        await this.blockService.update(block);
    }

    async processTransaction(txId: string, transactions : Transaction[], blockNumber: BigNumber, latestBlockNumber : BigNumber, txJson? : any) {

        txJson = txJson || await this.getTransaction(txId);

        const { owner_address, to_address, amount } = txJson.raw_data.contract[0].parameter.value;
            
        const fromAddress = this.tronWeb.address.fromHex(owner_address);
        const toAddress = this.tronWeb.address.fromHex(to_address);


        // console.log(`Transaction found in block ${blockNumber}:`);
        // console.log(`TXID: ${txId}`);
        // console.log(`From: ${fromAddress}`);
        // console.log(`To: ${toAddress}`);
        // console.log(`Amount: ${amount / 1e6} TRX`); // TRX birimlerine çevirmek için
        // console.log(`Fee: ${fee / 1e6} TRX`); // TRX birimlerine çevirmek için

        let fromWallet = await this.walletService.findByAddress(BlockchainName.TRON, fromAddress);
        let toWallet = await this.walletService.findByAddress(BlockchainName.TRON, toAddress);

        if (fromWallet) {
            // WITHDRAW + VIRMAN
            const transaction = await this.transactionService.findByTxHash(BlockchainName.TRON, txId);
            if (!transaction) {
                // TODO: Handle case if txDoc is null
            } else {

                const receipt = await this.getTransactionInfo(txId);            
                transaction.state = TransactionState.COMPLATED;
                transaction.amount = amount;
                transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
                transaction.fee = receipt.fee;
                transaction.processedBlockNumber = blockNumber.toString();
                transaction.complatedBlockNumber = latestBlockNumber.toString();
                transactions.push(transaction);
            }
        } else if (toWallet) {
            // DEPOSIT
            
            // toWallet.estimatedBalance = (new BigNumber(toWallet.estimatedBalance))
            //     .plus(txJSON.value).toString();

            const receipt = await this.getTransactionInfo(txId);            
            let transaction = new Transaction();

            transaction.blockchainName = BlockchainName.TRON;
            transaction.state = TransactionState.COMPLATED;
            transaction.type = TransactionType.DEPOSIT;
            transaction.hash = txId;
            transaction.from = fromAddress;
            transaction.to = toAddress;
            transaction.amount = amount;
            transaction.fee = receipt.fee;
            transaction.processedBlockNumber = blockNumber.toString();
            transaction.complatedBlockNumber = latestBlockNumber.toString();
            transactions.push(transaction);  
        }
    }

    async proccessBlock(transactions : Transaction[][], batchIndex : number, blockNumber: BigNumber, latestBlockNumber : BigNumber, retryBlock : BigNumber[], reTryCount = 0): Promise<void> {

        this.logger.debug('Tron block processed. blockNumber: ' + blockNumber);
        
        try {

            transactions[batchIndex] = new Array<Transaction>();
            const blockJson = await this.getBlock(blockNumber);
            if (!blockJson) {
                throw new Error(`Err1. in Tron processBlock. blockNumber: ${blockNumber}`);
            }

            if (blockJson && blockJson.transactions) {

                for (let i = 0; i < blockJson.transactions.length; i += this.batchSize) {

                    let batchTransactions = new Array<Transaction>();
                    const currentBatch = blockJson.transactions.slice(i, i + this.batchSize);
                    
                    // Her işlem için bir promise oluştur
                    const promises = currentBatch.map(async (txJson: any) => {

                        const txId = txJson.txID;
                        if (txJson.raw_data.contract[0].type === 'TransferContract') {
                            
                            let hasError = false;
                            let tryCount = 0;
                            let errorMessage : string;
                            do {
                                try {
                                    hasError = false;
                                    await this.processTransaction(txId, batchTransactions, blockNumber, latestBlockNumber, txJson);
                                } catch (error) {
                                    hasError = true;
                                    tryCount++;
                                    errorMessage = error?.message || error?.toString();
                                }
                            } while(hasError && tryCount < 40);

                            if(hasError) {
                                let transaction = new Transaction();
                                transaction.processedBlockNumber = blockNumber.toString();
                                transaction.blockchainName = BlockchainName.TRON;
                                transaction.state = TransactionState.COMPLATED;
                                transaction.hash = txId;
                                transaction.hasError = true;
                                transaction.error = errorMessage;
                                batchTransactions.push(transaction);  
                            }
                        }
                    });

                    // 'Promise.all' ile tüm promise'leri bekle
                    await Promise.all(promises);
                    for(const transaction of batchTransactions) {
                        transactions[batchIndex].push(transaction);
                    }
                }
            }

        } catch (error) {
            if(reTryCount < 4) {
                await sleep(2000);
                await this.proccessBlock(transactions, batchIndex, blockNumber, latestBlockNumber, retryBlock, (reTryCount + 1));
            } else {
                retryBlock.push(blockNumber);
            }
        }
    }
}
