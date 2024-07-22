import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { BitcoinService } from "./bitcoin/bitcoin.service";
import { EthereumService } from "./ethereum/ethereum.service";
import { TronService } from "./tron/tron.service";
import { ConfigService } from "@nestjs/config";
import { BlockchainName } from "src/_common/enums/blockchain.name.enums";
import { Transaction } from "src/transaction/transaction.model";
import { from } from "rxjs";
import { WalletService } from "src/wallet/wallet.service";
import { Wallet } from "src/wallet/wallet.model";

@Injectable()
export class NetworkService implements OnModuleInit {
	protected readonly logger = new Logger(NetworkService.name);

	private withdrawWallets : {
		[BlockchainName.BITCOIN] : Wallet,
		[BlockchainName.ETHEREUM] : Wallet,
		[BlockchainName.TRON] : Wallet,

	}

	constructor(
		protected configService: ConfigService,
		protected walletService : WalletService,
		protected bitcoinService : BitcoinService,
		protected ethereumService : EthereumService,
		protected tronService: TronService
	) {

	}


	async onModuleInit(): Promise<void> {		
		await this.initService();
	}

	async initService(): Promise<void> {
		this.withdrawWallets = {
			[BlockchainName.BITCOIN] : await this.walletService.findOne({
				blockchainName : BlockchainName.BITCOIN,
				index : 0
			}),
			[BlockchainName.ETHEREUM] : await this.walletService.findOne({
				blockchainName : BlockchainName.ETHEREUM,
				index : 0
			}),
			[BlockchainName.TRON] : await this.walletService.findOne({
				blockchainName : BlockchainName.TRON,
				index : 0
			})
		}

	}


	async createTransaction(transaction : Transaction, blockchainName: BlockchainName, to: string, amounth: string) : Promise<Transaction> {
		switch(blockchainName) {

			case BlockchainName.BITCOIN : {
				transaction = await this.bitcoinService.createTransaction(
					transaction,
					to,
					amounth,
					this.withdrawWallets[blockchainName]
				)
				break;
			}

			case BlockchainName.ETHEREUM : {
				transaction = await this.ethereumService.createTransaction(
					transaction,
					to,
					amounth,
					this.withdrawWallets[blockchainName]
				)
				break;
			}

			case BlockchainName.TRON : {
				transaction = await this.tronService.createTransaction(
					transaction,
					to,
					amounth,
					this.withdrawWallets[blockchainName]
				)
				break;

			}

		}

		return transaction;
	}


	async createTokenTransaction(transaction : Transaction, blockchainName: BlockchainName, tokenName : string, to: string, amounth: string) : Promise<Transaction> {

		switch(blockchainName) {

			case BlockchainName.BITCOIN : {

				break;
			}

			case BlockchainName.ETHEREUM : {

				break;
			}

			case BlockchainName.TRON : {

				break;
			}

		}

		return transaction;
	}



}
