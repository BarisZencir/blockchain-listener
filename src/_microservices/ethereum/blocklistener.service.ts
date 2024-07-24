import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { Wallet } from 'ethers';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { Block } from 'src/block/block.model';
import { BlockService } from 'src/block/block.service';
import { EthereumService } from 'src/networks/ethereum/ethereum.service';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionService } from 'src/transaction/transaction.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class BlockListenerService extends EthereumService implements OnModuleInit {

    logger = new Logger(BlockListenerService.name);

    constructor(
        protected configService: ConfigService,
        protected readonly blockService: BlockService,
        protected readonly walletService: WalletService,
        protected readonly transactionService: TransactionService

    ) { 
        super(configService, walletService);
    }

    async onModuleInit(): Promise<void> {
        await super.initService();
    }

    async getLatestProccessedBlockNumber() : Promise<BigNumber> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.ETHEREUM,
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
        block.blockchainName = BlockchainName.ETHEREUM;
        await this.blockService.save(block);
    }

    async updateBlock(blockNumber: BigNumber) : Promise<void> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.ETHEREUM,
            groupIndex : -1
        })
        block.blockNumber = blockNumber.toString();
        await this.blockService.update(block);
    }

    async proccessBlock(transactions : Transaction[][], batchIndex : number, blockNumber: BigNumber, latestBlockNumber : BigNumber): Promise<void> {

        this.logger.debug('Ethereum block processed. blockNumber: ' + blockNumber);
        
        try {
            
            transactions[batchIndex] = new Array<Transaction>();
            const blockJSON = await this.getBlock(blockNumber);
            if (!blockJSON) {
                throw new Error(`Err1. in Ethereum processBlock. blockNumber: ${blockNumber}`);
            }

            const transactionHashList = blockJSON.transactions || [];
            let txHash : string;
            for (let i = 0; i < transactionHashList.length; i++) {
                try {
                    const txJSON = await this.getTransaction(transactionHashList[i]);

                    let fromWallet = await this.walletService.findByAddress(BlockchainName.ETHEREUM, txJSON.from);
                    let toWallet = await this.walletService.findByAddress(BlockchainName.ETHEREUM, txJSON.to);
                    txHash = txJSON.hash;
                    if (fromWallet) {
                        // WITHDRAW + VIRMAN
                        const transaction = await this.transactionService.findByTxHash(BlockchainName.ETHEREUM, txJSON.hash);
                        if (!transaction) {
                            // TODO: Handle case if txDoc is null
                        } else {
 
                            transaction.state = TransactionState.COMPLATED;
                            transaction.amount = txJSON.value;
                            transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
                            transaction.fee = new BigNumber(txJSON.gasPrice).multipliedBy(new BigNumber(txJSON.gas)).toString();
                            transaction.processedBlockNumber = String(txJSON.blockNumber);
                            transaction.complatedBlockNumber = blockNumber.toString();
                            transactions[batchIndex].push(transaction);            

                        }
                    } else if (toWallet) {
                        // DEPOSIT
                        
                        // toWallet.estimatedBalance = (new BigNumber(toWallet.estimatedBalance))
                        //     .plus(txJSON.value).toString();

                        let transaction = new Transaction();
 
                        transaction.blockchainName = BlockchainName.ETHEREUM;
                        transaction.state = TransactionState.COMPLATED;
                        transaction.type = TransactionType.DEPOSIT;
                        transaction.hash = txJSON.hash;
                        transaction.from = txJSON.from;
                        transaction.to = txJSON.to;
                        transaction.amount = txJSON.value;
                        transaction.fee = new BigNumber(txJSON.gasPrice).multipliedBy(new BigNumber(txJSON.gas)).toString();
                        transaction.processedBlockNumber = blockNumber.toString();
                        transaction.complatedBlockNumber = latestBlockNumber.toString();
                        transactions[batchIndex].push(transaction);            

                    }
                } catch (error) {
                    let transaction = new Transaction();
                    transaction.processedBlockNumber = blockNumber.toString();
                    transaction.blockchainName = BlockchainName.ETHEREUM;
                    transaction.state = TransactionState.COMPLATED;
                    transaction.hash = txHash;
                    transaction.hasError = true;
                    transaction.error = error?.message || error?.toString();
                    transactions[batchIndex].push(transaction);  
                }
            }
        } catch (error) {
            let transaction = new Transaction();
            transaction.processedBlockNumber = blockNumber.toString();
            transaction.blockchainName = BlockchainName.ETHEREUM;
            transaction.state = TransactionState.COMPLATED;
            transaction.hasError = true;
            transaction.error = error?.message || error?.toString();
            transactions[batchIndex].push(transaction);  
        }
    }
}
