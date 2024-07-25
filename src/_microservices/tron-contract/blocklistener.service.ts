import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { Wallet } from 'ethers';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { sleep } from 'src/_common/utils/sandbox.utils';
import { Block } from 'src/block/block.model';
import { BlockService } from 'src/block/block.service';
import { ITransferEvent } from 'src/networks/ethereum/ethereum.contract.service';
import { TronTokenName } from 'src/networks/tron/enum/token.name';
import { TronContractService } from 'src/networks/tron/tron.contract.service';
import { TronService } from 'src/networks/tron/tron.service';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionService } from 'src/transaction/transaction.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class BlockListenerService extends TronContractService implements OnModuleInit {

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
        let contractNames = "Tron Contract Listener - tokenGroupIndex: " + this. tokenGroupIndex + "   ->  ";
        for(let i = 0; i < this.availableTokenNames.length; i++) {
            let name = await this.getContractName(this.availableTokenNames[i]);
            contractNames += name + " ";
        }
        this.logger.debug(contractNames);
    }

    async getLatestProccessedBlockNumber() : Promise<BigNumber> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.TRON,
            groupIndex : this.tokenGroupIndex
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
        block.groupIndex = this.tokenGroupIndex;
        await this.blockService.save(block);
    }

    async updateBlock(blockNumber: BigNumber) : Promise<void> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.TRON,
            groupIndex : this.tokenGroupIndex
        })
        block.blockNumber = blockNumber.toString();
        await this.blockService.update(block);
    }


    async processEvent(event : ITransferEvent, transactions : Transaction[], blockNumber: BigNumber, latestBlockNumber : BigNumber) {

        let fromWallet = await this.walletService.findByAddress(BlockchainName.TRON, event.from);
        let toWallet = await this.walletService.findByAddress(BlockchainName.TRON, event.to);
        
        if (fromWallet) {
            // WITHDRAW + VIRMAN
            const transaction = await this.transactionService.findByTxHash(BlockchainName.TRON, event.transactionHash);
            if (!transaction) {
                // TODO: Handle case if txDoc is null
            } else {

                const receipt = await this.getTransactionInfo(event.transactionHash);            

                transaction.state = TransactionState.COMPLATED;
                transaction.amount = event.value;
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

            const receipt = await this.getTransactionInfo(event.transactionHash);            

            let transaction = new Transaction();

            transaction.blockchainName = BlockchainName.TRON;
            transaction.tokenName = event.tokenName;
            transaction.state = TransactionState.COMPLATED;
            transaction.type = TransactionType.DEPOSIT;
            transaction.hash = event.transactionHash;
            transaction.from = event.from;
            transaction.to = event.to;
            transaction.amount = event.value;
            transaction.fee = receipt.fee;
            transaction.processedBlockNumber = blockNumber.toString();
            transaction.complatedBlockNumber = latestBlockNumber.toString();
            transactions.push(transaction);
        }
    }

    async proccessBlock(transactions : Transaction[][], batchIndex : number, blockNumber: BigNumber, latestBlockNumber : BigNumber, retryBlock : BigNumber[], reTryCount = 0): Promise<void> {

        this.logger.debug('Tron( token group index: '+ this.tokenGroupIndex +') block processed. blockNumber: ' + blockNumber);
        
        try {
            let events = new Array<ITransferEvent>();
            transactions[batchIndex] = new Array<Transaction>();

            for(let tokenName of this.availableTokenNames) {
                let tokenEvents = await this.getContractTransferEvents(tokenName, blockNumber.toNumber());
                if(tokenEvents.length) {
                    events = events.concat(tokenEvents);
                }
            }

            for (let event of events) {
                let txId = event.transactionHash;

                let hasError = false;
                let tryCount = 0;
                let errorMessage : string;
                do {
                    try {
                        hasError = false;
                        await this.processEvent(event, transactions[batchIndex], blockNumber, latestBlockNumber);
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
                    transaction.tokenName = event.tokenName;
                    transaction.state = TransactionState.COMPLATED; 
                    transaction.hash = txId;
                    transaction.hasError = true;
                    transaction.event = JSON.stringify(event);
                    transaction.error = errorMessage;
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
