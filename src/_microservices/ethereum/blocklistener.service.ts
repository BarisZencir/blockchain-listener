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

    constructor(
        protected configService: ConfigService,
        protected readonly blockService: BlockService,
        protected readonly walletService: WalletService,
        protected readonly transactionService: TransactionService

    ) { 
        super(configService, walletService);
    }

    async onModuleInit(): Promise<void> {
        super.onModuleInit();
    }

    async getLatestProccessedBlockNumber() : Promise<BigNumber> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.ETHEREUM
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
        this.blockService.save(block);
    }

    async updateBlock(blockNumber: BigNumber) : Promise<void> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.ETHEREUM
        })
        block.blockNumber = blockNumber.toString();
        this.blockService.update(block);
    }

    async proccessBlock(blockNumber: BigNumber): Promise<boolean> {

        this.logger.debug('Ethereum block processed. blockNumber: ' + blockNumber);
        
        try {
            
            let hasTransaction = false;
            const blockJSON = await this.getBlock(blockNumber);
            if (!blockJSON) {
                throw new Error(`Err1. in Ethereum processBlock. blockNumber: ${blockNumber}`);
            }

            const transactionHashList = blockJSON.transactions || [];

            for (let i = 0; i < transactionHashList.length; i++) {
                try {
                    const txJSON = await this.getTransaction(transactionHashList[i]);

                    let fromWallet = await this.walletService.findByAddress(BlockchainName.ETHEREUM, txJSON.from);
                    let toWallet = await this.walletService.findByAddress(BlockchainName.ETHEREUM, txJSON.to);

                    if (fromWallet) {
                        // WITHDRAW + VIRMAN
                        const transaction = await this.transactionService.findByTxHash(BlockchainName.ETHEREUM, txJSON.hash);
                        if (!transaction) {
                            // TODO: Handle case if txDoc is null
                        } else {
 
                            transaction.state = TransactionState.COMPLATED;
                            transaction.amount = String(txJSON.value);
                            transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
                            transaction.fee = new BigNumber(txJSON.gasPrice).multipliedBy(new BigNumber(txJSON.gas)).toString();
                            transaction.processedBlockNumber = String(txJSON.blockNumber);
                            transaction.complatedBlockNumber = blockNumber.toString();
                            await this.transactionService.update(transaction);

                            hasTransaction = true;
                        }
                    } else if (toWallet) {
                        // DEPOSIT
                        let transaction = new Transaction();
 
                        transaction.blockchainName = BlockchainName.ETHEREUM;
                        transaction.state = TransactionState.COMPLATED;
                        transaction.type = TransactionType.DEPOSIT;
                        transaction.hash = txJSON.hash;
                        transaction.from = txJSON.from;
                        transaction.to = txJSON.to;
                        transaction.amount = String(txJSON.value);
                        transaction.fee = new BigNumber(txJSON.gasPrice).multipliedBy(new BigNumber(txJSON.gas)).toString();
                        transaction.processedBlockNumber = String(txJSON.blockNumber);
                        transaction.complatedBlockNumber = blockNumber.toString();

                        await this.transactionService.save(transaction);
                        hasTransaction = true;
                    }
                } catch (error) {
                    //TODO: blockta hata alindi bunu db'ye yazalim.
                    throw error;
                }
            }

            await this.updateBlock(blockNumber);
            return hasTransaction;
        } catch (error) {
            throw error;
        }
    }
}
