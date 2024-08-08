'use strict';
import * as _ from 'lodash';
import Client from 'bitcoin-core';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { WalletService } from 'src/wallet/wallet.service';
import BigNumber from 'bignumber.js';
import { UtxoService } from 'src/utxo/utxo.service';
import { UtxoState } from 'src/utxo/enum/utxo.state';
import { Utxo } from 'src/utxo/utxo.model';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';
import { TransactionService } from 'src/transaction/transaction.service';
import { Wallet } from 'src/wallet/wallet.model';
import { Input, Output, QuickNodeClient } from './quicknode.client';

type Settings = {
	connectionInfo : {
		host: string,
		port : number,
		username : string,
		password : string
	}
};

const CURRENCY_TO_UNIT = new BigNumber("100000000");

@Injectable()
export class BitcoinService implements OnModuleInit {
	protected readonly logger = new Logger(BitcoinService.name);
	private client: any;
	protected settings: Settings | null;
	private clientType : string;
	constructor(
		protected configService: ConfigService,
		protected walletService: WalletService,
		protected utxoService : UtxoService,
	) {
		this.client = null;
		this.clientType = this.configService.get<string>("network.bitcoin.clientType");
		this.settings = {
			connectionInfo : {
				host : this.configService.get<string>("network.bitcoin.host"),
				port : this.configService.get<number>("network.bitcoin.port"),
				username : this.configService.get<string>("network.bitcoin.username"),
				password : this.configService.get<string>("network.bitcoin.password"),
			}

		}

	}

	async onModuleInit(): Promise<void> {		
		await this.initService();
	}

	async initService(): Promise<void> {		
		await this.connect();
	}


    private async checkAndTryConnection(): Promise<void> {
        if (!this.isConnected()) {
            await this.connect();
        }
    }

    async connect(): Promise<boolean> {
		
		if(this.clientType == "bitcoin-core") {
			if (this.settings?.connectionInfo?.host) {
				try {
					this.client = new Client(this.settings.connectionInfo);
					if (this.client) {
						const info = await this.client.getNetworkInfo();
						if (info && info.networkactive) {
							this.logger.debug('Bitcoin Network connection successful.');
							return true;
						} else {
							this.client = null;
							throw 'Cant listen Bitcoin Network Provider.';
						}
					} else {
						this.client = null;
						throw 'Cant Connect to Bitcoin Network Provider.';
					}
		
				} catch(error) {
					throw error;
				}
			} else {
				throw new Error('Network Error. There is no connection to settings defined.');
			}
		}

		if(this.clientType == "quicknode") {
			if (this.settings?.connectionInfo?.host) {
				try {
					const network = this.configService.get<string>("network.bitcoin.network");
					this.client = new QuickNodeClient(this.settings.connectionInfo.host, network);
					const info = await this.client.getBlockCount();
					if (info) {
						this.logger.debug('Bitcoin Network connection successful.');



						// # VIRMAN TEST
						// let signer = await this.walletService.getWalletAsSignerByAddress(BlockchainName.BITCOIN, "bc1quz84h2a6e0y8j7g66qgph8s5kgmt6rwkgjl23c");
						// let tx = await this.createTransaction("bc1qzs7mgdmmpehqrknx747nwxvhyk603v9rvku64l", "0.0001", signer);
						// console.log(tx);

						return true;
					} else {
						this.client = null;
						throw 'Cant listen Bitcoin Network Provider.';
					}	
				} catch(error) {
					throw error;
				}
			} else {
				throw new Error('Network Error. There is no connection to settings defined.');
			}
		}

    }

	async isConnected(): Promise<boolean> {
		if (this.client === null) {
			return false;
		}
		try {
			const info = await this.client.getNetworkInfo();
			if (info && info.networkactive) {
				return true;
			}

			return false;
		} catch {
			return false;
		}
	}

    async getBlockNumber(): Promise<BigNumber> {
        await this.checkAndTryConnection();
        return BigNumber((await this.client.getBlockCount()).toString());
    }

	async getBlock(blockNumber: BigNumber): Promise<any> {
		await this.checkAndTryConnection();
		const blockHash = await this.client.getBlockHash(blockNumber.toNumber());
		if (blockHash == null) {
			throw 'getBlock - getBlockHash returns null.';
		}
		return this.client.getBlock(blockHash);
	}

    convertCurrencyToUnit(amount : string | number | BigNumber) : BigNumber {
		return (new BigNumber(amount)).times(CURRENCY_TO_UNIT);
	}
	
	convertUnitToCurrency(amount : string | number | BigNumber) : BigNumber {
		return (new BigNumber(amount)).div(CURRENCY_TO_UNIT);
	}

    // async getBalance(address: string): Promise<BigNumber> {
    //     await this.checkAndTryConnection();
	// 	throw Error("not implemented yet.");
	// }

	// async sendRawTransaction(inputs: any[], outputs: any, wif: string) : Promise<any>{
	// 	await this.checkAndTryConnection();
	// 	const rawTx = await this.client.createRawTransaction(inputs, outputs);
	// 	const signedRawTx = await this.client.signRawTransaction(rawTx, null, [wif]);
	// 	this.logger.debug(rawTx);
	// 	this.logger.debug(signedRawTx);
	
	// 	if (_.isUndefined(signedRawTx.complete)) {
	// 	  throw 'RPC error occurred.';
	// 	}
	
	// 	if (signedRawTx.complete) {
	// 	  const txId = await this.client.sendRawTransaction(signedRawTx.hex);
	// 	  const transaction = await this.getRawTransaction(txId);
	// 	  return transaction;
	// 	} else {
	// 	  throw 'Transaction could not be completed.';
	// 	}
	// }

	// İşlem oluşturma işlevi
	// amount örnek: "0.1" btc
	async createTransaction(to: string, amount: string, _signer: Wallet): Promise<Transaction> {
		let transaction = new Transaction();
		try {
			// Adım 1: UTXO'ları MongoDB'den alın
			const utxos = await this.utxoService.findByAddressAndState(BlockchainName.BITCOIN, _signer.address, UtxoState.UN_SPENT);
			const satoshiFee = this.configService.get<BigNumber>("network.bitcoin.satoshiFee");

			const satoshiAmount = this.convertCurrencyToUnit(amount);
			const inputs: Input[] = [];
			let totalAmount = new BigNumber(0);
			let usedUtxos : Utxo[] = [];

			for (const utxo of utxos) {
				inputs.push({ txid: utxo.txid, vout: utxo.vout });
				totalAmount = totalAmount.plus(utxo.amount);
				usedUtxos.push(utxo);
				if (totalAmount.gte(satoshiAmount.plus(satoshiFee))) break;
			}

			if (totalAmount.lt(satoshiAmount.plus(satoshiFee))) {
				throw new Error('Yeterli bakiye yok');
			}

			// Adım 2: Çıktıları oluşturun
			const outputs: Output = {};
			outputs[to] = parseFloat(amount);

			const change = totalAmount.minus(satoshiAmount).minus(satoshiFee);
			if (change.gt(0)) {
				outputs[_signer.address] = this.convertUnitToCurrency(change).toNumber(); // Değişim adresi
			}

			// Adım 3: İşlemi oluşturun
			const rawTx = await this.client.createRawTransaction(inputs, outputs);

			// Adım 4: İşlemi imzalayın
			const signedTx = await this.client.signRawTransactionWithKey(rawTx, [_signer.privateKey]);

			// Adım 5: İşlemi yayınlayın
			const txid = await this.client.sendRawTransaction(signedTx.hex);

			for (const utxo of usedUtxos) {
				utxo.state = UtxoState.ON_SPENDING;
				utxo.estimatedUsedTxid = txid;
				await this.utxoService.update(utxo);
			}

			transaction.hash = txid;
			transaction.state = TransactionState.REQUESTED;
			transaction.estimatedAmount = satoshiAmount.toString();


			let toWallet = await this.walletService.findOne({
				blockchainName : BlockchainName.BITCOIN,
				address : to   
			});
			transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
			transaction.blockchainName = BlockchainName.BITCOIN;
			transaction.from = _signer.address;
			transaction.to = to;
			transaction.estimatedFee = satoshiFee.toString();
			transaction.requestedBlockNumber = (await this.getBlockNumber())?.toString();

			this.logger.debug('İşlem ID:', txid);
			return transaction;
		} catch (error) {
			this.logger.error('Hata:', error);
            transaction.hasError = true;
			transaction.error = error.toString();
			return transaction;
		}
	}

	async getTransaction(txId: string) {
		await this.checkAndTryConnection();
		return this.client.getTransaction(txId);
	}
	
	async getRawTransaction(txId: string) {
		await this.checkAndTryConnection();
		return this.client.getRawTransaction(txId, 1);
	}

}
