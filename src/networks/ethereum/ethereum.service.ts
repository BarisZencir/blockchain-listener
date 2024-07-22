'use strict';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { WalletService } from 'src/wallet/wallet.service';

import _ from 'lodash';
import BigNumber from "bignumber.js";
import * as ethUtil from 'ethereumjs-util';
import Web3 from 'web3';
import Common from 'ethereumjs-common';
import { sleep } from 'src/_common/utils/sandbox.utils';
import { TransactionService } from 'src/transaction/transaction.service';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';

type Settings = {
    ws: string,
    chainId : number,
    networkId : number
};

@Injectable()
export class EthereumService implements OnModuleInit {
	protected readonly logger = new Logger(EthereumService.name);

	protected web3: Web3 | null;
	protected settings: Settings | null;
	
	constructor(
		protected configService: ConfigService,
		protected walletService: WalletService,
        protected transactionService : TransactionService
	) {
		this.web3 = null;
        
		this.settings = {
            ws : this.configService.get<string>("network.ethereum.ws"),
            chainId : this.configService.get<number>("network.ethereum.chainId"),
            networkId : this.configService.get<number>("network.ethereum.networkId")
        }
	}

	async onModuleInit(): Promise<void> {
		
		await this.initService();

        // let isConnected = await this.isConnected();
        // console.log("isConnected: " + isConnected);

        // let blockNumber = await this.getBlockNumber();
        // console.log("blockNumber: " + blockNumber);

        // let block = await this.getBlock(blockNumber);
        // console.log("block: " + block);

        // let balance = await this.getBalance("0x7a19821b82165c5e0cc3ce54cdef03d0a1328556");
        // console.log("balance: " + balance);

        // let tx = await this.sendRawTransaction(
        //     "0x7a19821b82165c5e0cc3ce54cdef03d0a1328556", 
        //     "0xb9d1EC049d114fc42AAb60A36D49282ee1D69679",
        //     "123",
        //     "0xe6bf150b27a8a3f60e3a1722dba3444f812f656507c0e50c1d013d09825850ef"
        // );

        // console.log("tx: " + tx);

        // tx = await this.getTransaction(tx.hash);
        // console.log("tx: " + tx);

        // await sleep(1000 * 60);

        // balance = await this.getBalance("0xb9d1EC049d114fc42AAb60A36D49282ee1D69679");
        // console.log("balance(acc 2): " + balance);
	}

    async initService(): Promise<void> {		
		await this.connect();
	}

    protected async checkAndTryConnection(): Promise<void> {
        if (!this.isConnected()) {
            await this.connect();
        }
    }

    async connect(): Promise<boolean> {

        if (this.settings) {
            this.web3 = new Web3(new Web3.providers.HttpProvider(this.settings.ws));

            if (this.web3) {
                const isListening = await this.web3.eth.net.isListening();
                if (isListening) {
                    console.log('Ethereum Network connection successful.');
                    return true;
                } else {
                    this.web3 = null;
                    throw new Error('Cannot listen to Ethereum Network Provider.');
                }
            } else {
                this.web3 = null;
                throw new Error('Cannot connect to provider.');
            }    
        } else {
            throw new Error('Network Error. There is no connection to settings defined.');
        }
    }

	async isConnected(): Promise<boolean> {
		if (this.web3 === null) {
			return false;
		}
		try {
			return await this.web3.eth.net.isListening();
		} catch {
			return false;
		}
	}

    async getBlockNumber(): Promise<BigNumber> {
        await this.checkAndTryConnection();
        return BigNumber((await this.web3!.eth.getBlockNumber()).toString());
    }

    async getBlock(blockNumber: BigNumber): Promise<any> {
        await this.checkAndTryConnection();
        return this.web3!.eth.getBlock(blockNumber.toString());
    }

    async getBalance(address: string): Promise<BigNumber> {
        await this.checkAndTryConnection();
        return BigNumber((await this.web3!.eth.getBalance(address)).toString());		
    }

    
    async sendRawTransaction(from: string, to: string, amount: string, privateKey: string): Promise<any> {
        await this.checkAndTryConnection();

        const txCount = await this.web3!.eth.getTransactionCount(from);
		let value = this.web3.utils.numberToHex(this.web3!.utils.toWei(amount, 'ether'));
        const tx = {
            nonce: this.web3.utils.numberToHex(txCount),
            to: to,
            value : value,
            gasLimit: this.web3.utils.numberToHex(100000),
            gasPrice: this.web3.utils.numberToHex(this.web3!.utils.toWei('11', 'gwei')),
            chainId: this.settings.chainId

        };
        
        const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);        
        
        let transaction = new Transaction();
        transaction.hash = receipt.transactionHash.toString();
        transaction.state = TransactionState.REQUESTED;
        transaction.estimatedAmount = value;

        let toWallet = await this.walletService.findOne({
            blockchainName : BlockchainName.ETHEREUM,
            address : to   
        });

        transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
        transaction.blockchainName = BlockchainName.ETHEREUM;
        transaction.from = from;
        transaction.to = to;
        transaction.estimatedFee = (new BigNumber(tx.gasPrice)).times(tx.gasLimit).toString();
        transaction.requestedBlockNumber = (await this.getBlockNumber())?.toString();
        await this.transactionService.save(transaction);
        
        return receipt;

    }

    //old works fine but better is better. 
    // async sendRawTransaction(from: string, to: string, amount: string, privateKey: string): Promise<any> {
    //     await this.checkAndTryConnection();

    //     const txCount = await this.web3!.eth.getTransactionCount(from);
	// 	let value = this.web3!.utils.numberToHex(this.web3!.utils.toWei(amount, 'ether'));
    //     const txData = {
    //         nonce: this.web3!.utils.numberToHex(txCount),
    //         gasLimit: this.web3!.utils.numberToHex(21000),
    //         gasPrice: this.web3!.utils.numberToHex(this.web3!.utils.toWei('10', 'gwei')),
    //         to: to,
    //         value: value,
    //         chainId: this.settings.chainId
    //     };

    //     const common = Common.forCustomChain('mainnet', { 
    //         name: 'custom',
    //         networkId: this.settings.networkId,
    //         chainId: this.settings.chainId
    //     }, 'petersburg');

    //     const tx = new Transaction(txData, { common });

    //     tx.sign(ethUtil.toBuffer(privateKey));

    //     const serializedTx = tx.serialize();
    //     const rawTx = '0x' + serializedTx.toString('hex');

    //     const txResponse = await this.web3!.eth.sendSignedTransaction(rawTx);
    //     const txResult = await this.getTransaction(txResponse.transactionHash.toString());
    //     return txResult;
    // }

    async getTransaction(transactionHash: string): Promise<any> {
        await this.checkAndTryConnection();
        return this.web3!.eth.getTransaction(transactionHash);
    }


    //##############################################################
    //                 WALLET KULLANAN SERVISLER
    //##############################################################

}
