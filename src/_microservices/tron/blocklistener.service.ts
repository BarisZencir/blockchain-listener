import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { Wallet } from 'ethers';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
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

    async proccessBlock(blockNumber: BigNumber, latestBlockNumber : BigNumber): Promise<boolean> {

        this.logger.debug('Tron block processed. blockNumber: ' + blockNumber);
        
        try {
            
            let hasTransaction = false;
            const blockJson = await this.getBlock(blockNumber);
            if (!blockJson) {
                throw new Error(`Err1. in Tron processBlock. blockNumber: ${blockNumber}`);
            }

            if (blockJson && blockJson.transactions) {
                for (let i = 0; i < blockJson.transactions.length; i++) {
                    const txJson = blockJson.transactions[i];
                    try {
                        if (txJson.raw_data.contract[0].type === 'TransferContract') {
                            const { owner_address, to_address, amount } = txJson.raw_data.contract[0].parameter.value;
            
                            const fromAddress = this.tronWeb.address.fromHex(owner_address);
                            const toAddress = this.tronWeb.address.fromHex(to_address);
            
                            const txId = txJson.txID;
            
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
                                    await this.transactionService.update(transaction);
            
                                    hasTransaction = true;
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
            
                                await this.transactionService.save(transaction);
                                hasTransaction = true;
                            }
                        }
                    } catch(error) {
                        //TODO: blockta hata alindi bunu db'ye yazalim.
                        throw error;
                    }
                }
            }

            await this.updateBlock(blockNumber);
            return hasTransaction;
        } catch (error) {
            throw error;
        }
    }
}
