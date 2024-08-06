import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { Wallet } from 'ethers';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { sleep } from 'src/_common/utils/sandbox.utils';
import { Block } from 'src/block/block.model';
import { BlockService } from 'src/block/block.service';
import { EthereumTokenName } from 'src/networks/ethereum/enum/token.name';
import { EthereumContractService, ITransferEvent } from 'src/networks/ethereum/ethereum.contract.service';
import { EthereumService } from 'src/networks/ethereum/ethereum.service';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionService } from 'src/transaction/transaction.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class BlockListenerService extends EthereumContractService implements OnModuleInit {

    logger = new Logger(BlockListenerService.name);
    private batchSize : number;

    constructor(
        protected configService: ConfigService,
        protected readonly blockService: BlockService,
        protected readonly walletService: WalletService,
        protected readonly transactionService: TransactionService

    ) { 
        super(configService, walletService);
        this.batchSize = this.configService.get<number>("network.ethereum.batchSize");
    }

    async onModuleInit(): Promise<void> {
        await super.initService();

        let contractNames = "Ethereum Contract Listener - tokenGroupIndex: " + this. tokenGroupIndex + "   ->  ";
        for(let i = 0; i < this.availableTokenNames.length; i++) {
            let name = await this.getContractName(this.availableTokenNames[i]);
            contractNames += name + " ";
        }
        this.logger.debug(contractNames);

    }

    async getLatestProccessedBlockNumber() : Promise<BigNumber> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.ETHEREUM,
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
        block.blockchainName = BlockchainName.ETHEREUM;
        block.groupIndex = this.tokenGroupIndex;
        await this.blockService.save(block);
    }

    async updateBlock(blockNumber: BigNumber) : Promise<void> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.ETHEREUM,
            groupIndex : this.tokenGroupIndex
        })
        block.blockNumber = blockNumber.toString();
        await this.blockService.update(block);
    }


    async processEvent(event : ITransferEvent, transactions : Transaction[], blockNumber: BigNumber, latestBlockNumber : BigNumber) {
        let txJSON = await this.getTransaction(event.transactionHash);
        let fromWallet = await this.walletService.findByAddress(BlockchainName.ETHEREUM, event.from);
        let toWallet = await this.walletService.findByAddress(BlockchainName.ETHEREUM, event.to);

        if (fromWallet) {
            // WITHDRAW + VIRMAN
            const transaction = await this.transactionService.findByTxHash(BlockchainName.ETHEREUM, event.transactionHash);
            if (!transaction) {
                // TODO: Handle case if txDoc is null
            } else {

                transaction.state = TransactionState.COMPLATED;
                transaction.amount = event.value;
                transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
                transaction.fee = new BigNumber(txJSON.gasPrice).multipliedBy(new BigNumber(txJSON.gas)).toString();
                transaction.processedBlockNumber = blockNumber.toString();
                transaction.complatedBlockNumber = latestBlockNumber.toString();
                transactions.push(transaction);
            }
        } else if (toWallet) {
            // DEPOSIT
            
            // toWallet.estimatedBalance = (new BigNumber(toWallet.estimatedBalance))
            //     .plus(txJSON.value).toString();

            let transaction = new Transaction();

            transaction.blockchainName = BlockchainName.ETHEREUM;
            transaction.tokenName = event.tokenName;
            transaction.state = TransactionState.COMPLATED;
            transaction.type = TransactionType.DEPOSIT;
            transaction.hash = event.transactionHash;
            transaction.from = event.from;
            transaction.to = event.to;
            transaction.amount = event.value;
            transaction.fee = new BigNumber(txJSON.gasPrice).multipliedBy(new BigNumber(txJSON.gas)).toString();
            transaction.processedBlockNumber = blockNumber.toString();
            transaction.complatedBlockNumber = latestBlockNumber.toString();
            transactions.push(transaction);
        }
    }
    

    async proccessBlock(transactions : Transaction[][], batchIndex : number, blockNumber: BigNumber, latestBlockNumber : BigNumber, retryBlock : BigNumber[], reTryCount = 0): Promise<void> {

        this.logger.debug('Ethereum( token group index: '+ this.tokenGroupIndex +') block processed. blockNumber: ' + blockNumber);
        
        try {
            let events = new Array<ITransferEvent>();
            transactions[batchIndex] = new Array<Transaction>();

            for(let tokenName of this.availableTokenNames) {
                let tokenEvents = await this.getContractTransferEvents(tokenName, blockNumber.toNumber());
                if(tokenEvents.length) {
                    events = events.concat(tokenEvents);
                }
            }

            for (let i = 0; i < events.length; i += this.batchSize) {

                let batchTransactions = new Array<Transaction>();
                const currentBatch = events.slice(i, i + this.batchSize);

                // Her işlem için bir promise oluştur
                const promises = currentBatch.map(async (event: ITransferEvent) => {

                    let txId = event.transactionHash;

                    let hasError = false;
                    let tryCount = 0;
                    let errorMessage : string;
                    do {
                        try {
                            hasError = false;
                            await this.processEvent(event, batchTransactions, blockNumber, latestBlockNumber);
                        } catch (error) {
                            hasError = true;
                            tryCount++;
                            errorMessage = error?.message || error?.toString();
                        }
        
                    } while(hasError && tryCount < 40);

                    if(hasError) {
                        let transaction = new Transaction();
                        transaction.processedBlockNumber = blockNumber.toString();
                        transaction.blockchainName = BlockchainName.ETHEREUM;
                        transaction.tokenName = event.tokenName;
                        transaction.state = TransactionState.COMPLATED;
                        transaction.hash = txId;
                        transaction.hasError = true;
                        transaction.event = JSON.stringify(event);
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
