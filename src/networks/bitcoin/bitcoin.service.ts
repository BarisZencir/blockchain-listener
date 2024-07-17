'use strict';
import * as _ from 'lodash';
import * as Client from 'bitcoin-core';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { WalletService } from 'src/wallet/wallet.service';
import BigNumber from 'bignumber.js';
import { UtxoService } from 'src/utxo/utxo.service';


type Settings = {
	connectionInfo : {
		host: string,
		port : number,
		username : string,
		password : string
	}
};

const BITCOIN_TO_SATOSHI = 100000000;


@Injectable()
export class BitcoinService implements OnModuleInit {
	protected readonly logger = new Logger(BitcoinService.name);
	private client: any;
	protected settings: Settings | null;

	constructor(
		protected configService: ConfigService,
		protected walletService: WalletService,
		protected utxoService : UtxoService
	) {
		this.client = null;
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
		await this.connect();
	}

    private async checkAndTryConnection(): Promise<void> {
        if (!this.isConnected()) {
            await this.connect();
        }
    }

    async connect(): Promise<boolean> {

        if (this.settings?.connectionInfo?.host) {
			try {
				this.client = new Client(this.settings.connectionInfo);
				if (this.client) {
					const info = await this.client.getNetworkInfo();
					if (info && info.networkactive) {
						console.log('Bitcoin Network connection successful.');
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

	convertBitcoinToSatoshi(bitcoin : string) : BigNumber {
		return (new BigNumber(bitcoin)).times(BITCOIN_TO_SATOSHI);
	}

    async getBalance(address: string): Promise<BigNumber> {
        await this.checkAndTryConnection();
		throw Error("not implemented yet.");
	}

	async sendRawTransaction(inputs: any[], outputs: any, wif: string) : Promise<any>{
		await this.checkAndTryConnection();
		const rawTx = await this.client.createRawTransaction(inputs, outputs);
		const signedRawTx = await this.client.signRawTransaction(rawTx, null, [wif]);
		console.log(rawTx);
		console.log(signedRawTx);
	
		if (_.isUndefined(signedRawTx.complete)) {
		  throw 'RPC error occurred.';
		}
	
		if (signedRawTx.complete) {
		  const txId = await this.client.sendRawTransaction(signedRawTx.hex);
		  const transaction = await this.getRawTransaction(txId);
		  return transaction;
		} else {
		  throw 'Transaction could not be completed.';
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
