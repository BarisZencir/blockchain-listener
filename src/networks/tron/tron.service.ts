'use strict';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { WalletService } from 'src/wallet/wallet.service';

import _ from 'lodash';
import BigNumber from "bignumber.js";
import TronWeb from 'tronweb';
import { sleep } from 'src/_common/utils/sandbox.utils';
import { TransactionService } from 'src/transaction/transaction.service';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';

type Settings = {
    fullHost: string,
    apiKey: string,
    // apiPrivateKey: string
};

@Injectable()
export class TronService implements OnModuleInit {
	protected readonly logger = new Logger(TronService.name);

	protected tronWeb: TronWeb | null;
	protected settings: Settings | null;
	
	constructor(
		protected configService: ConfigService,
		protected walletService: WalletService,
        protected transactionService : TransactionService
	) {
		this.tronWeb = null;
        
		this.settings = {
            fullHost: this.configService.get<string>("network.tron.fullHost"),
            apiKey: this.configService.get<string>("network.tron.apiKey"),
            // apiPrivateKey: this.configService.get<string>("network.tron.apiPrivateKey")
        };
	}

	async onModuleInit(): Promise<void> {

		await this.initService();

        // let isConnected = await this.isConnected();
        // console.log("isConnected: " + isConnected);

        // let blockNumber = await this.getBlockNumber();
        // console.log("blockNumber: " + blockNumber);

        // let block = await this.getBlock(blockNumber);
        // console.log("block: " + block);

        // let balance = await this.getBalance("TJ5YQBGWPyzMT3pm1dDd5zGz8Th6wr6D4T");
        // console.log("balance: " + balance);

        // let tx = await this.sendRawTransaction(
        //     "TJ5YQBGWPyzMT3pm1dDd5zGz8Th6wr6D4T", 
        //     "TNUt8WZT4iB7vJScdEZt2RzgXJa78G46uP",
        //     "123",
        //     "your_private_key_here"
        // );

        // console.log("tx: " + tx);

        // tx = await this.getTransaction(tx.txID);
        // console.log("tx: " + tx);

        // await sleep(1000 * 60);

        // balance = await this.getBalance("TNUt8WZT4iB7vJScdEZt2RzgXJa78G46uP");
        // console.log("balance(acc 2): " + balance);
	}

    async initService(): Promise<void> {		
		await this.connect();
	}

    protected async checkAndTryConnection(): Promise<void> {
        if (!await this.isConnected()) {
            await this.connect();
        }
    }

    async connect(): Promise<boolean> {
        if (this.settings) {
            this.tronWeb = new TronWeb({
                fullHost: this.settings.fullHost,
                headers: { "TRON-PRO-API-KEY": this.settings.apiKey },
                // privateKey: this.settings.apiPrivateKey
              }
            )

            if (this.tronWeb) {
                let firstWallet = await this.walletService.findOne({
                    blockchainName : BlockchainName.TRON,
                    index : 0
                });
                this.tronWeb.setAddress(firstWallet.address);
                try {
                    const isListening = await this.tronWeb.isConnected();
                    if (isListening.fullNode && isListening.solidityNode && isListening.eventServer) {
                        console.log('Tron Network connection successful.');
                        return true;
                    } else {
                        this.tronWeb = null;
                        throw new Error('Cannot listen to Tron Network Provider.');
                    }
                } catch (error) {
                    this.tronWeb = null;
                    throw new Error('Cannot connect to provider.');
                }
            } else {
                throw new Error('Network Error. There is no connection to settings defined.');
            }
        } else {
            throw new Error('Network Error. There is no connection to settings defined.');
        }
    }

	async isConnected(): Promise<boolean> {
		if (this.tronWeb === null) {
			return false;
		}
		try {
			const isConnected = await this.tronWeb.isConnected();
			return isConnected.fullNode && isConnected.solidityNode && isConnected.eventServer;
		} catch {
			return false;
		}
	}

    async getBlockNumber(): Promise<BigNumber> {
        await this.checkAndTryConnection();
        const block = await this.tronWeb.trx.getCurrentBlock();
        return new BigNumber(block.block_header.raw_data.number);
    }

    async getBlock(blockNumber: BigNumber): Promise<any> {
        await this.checkAndTryConnection();
        return this.tronWeb.trx.getBlockByNumber(blockNumber.toNumber());
    }

    async getBalance(address: string): Promise<BigNumber> {
        await this.checkAndTryConnection();
        const balance = await this.tronWeb.trx.getBalance(address);
        return BigNumber(balance);
    }

    async sendRawTransaction(from: string, to: string, amount: string, privateKey: string): Promise<any> {
        await this.checkAndTryConnection();

        let value = this.tronWeb.toSun(amount);
        // const tradeObj = await this.tronWeb.trx.getTransactionObject(from, to, value);
        try {
            const tradeObj = await this.tronWeb.transactionBuilder.sendTrx(
                to,
                parseInt(value),
                from
            );
            const signedTxn = await this.tronWeb.trx.sign(tradeObj, privateKey);
            const receipt = await this.tronWeb.trx.sendRawTransaction(signedTxn);
    
            let transaction = new Transaction();
            transaction.hash = receipt.txid;
            transaction.state = TransactionState.REQUESTED;
            transaction.estimatedAmount = value;
    
            let toWallet = await this.walletService.findOne({
                blockchainName: BlockchainName.TRON,
                address: to
            });
    
            transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
            transaction.blockchainName = BlockchainName.TRON;
            transaction.from = from;
            transaction.to = to;
            transaction.estimatedFee = tradeObj.fee_limit;
            transaction.requestedBlockNumber = (await this.getBlockNumber()).toString();
            await this.transactionService.save(transaction);
            
            return receipt;
        } catch(error) {
            console.log(error);
        }
    }

    async getTransaction(transactionHash: string): Promise<any> {
        await this.checkAndTryConnection();
        return this.tronWeb.trx.getTransaction(transactionHash);
    }

    async getTransactionInfo(transactionHash: string): Promise<any> {
        await this.checkAndTryConnection();
        return this.tronWeb.trx.getTransactionInfo(transactionHash);
    }
}
