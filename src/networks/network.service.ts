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
import { EthereumContractService } from "./ethereum/ethereum.contract.service";
import { TronContractService } from "./tron/tron.contract.service";
import { EthereumTokenName } from "./ethereum/enum/token.name";
import { TronTokenName } from "./tron/enum/token.name";

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
		protected ethereumContractService : EthereumContractService,
		protected tronContractService: TronContractService,
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


	async createTransaction(blockchainName: BlockchainName, to: string, amount: string) : Promise<Transaction> {
		switch(blockchainName) {

			case BlockchainName.BITCOIN : {
				return await this.bitcoinService.createTransaction(
					to,
					amount,
					this.withdrawWallets[blockchainName]
				)
			}

			case BlockchainName.ETHEREUM : {
				return await this.ethereumContractService.createTransaction(
					to,
					amount,
					this.withdrawWallets[blockchainName]
				)
			}

			case BlockchainName.TRON : {
				return await this.tronContractService.createTransaction(
					to,
					amount,
					this.withdrawWallets[blockchainName]
				)

			}

		}
	}

	async createTokenTransaction(blockchainName: BlockchainName, tokenName : string, to: string, amount: string) : Promise<Transaction> {

		switch(blockchainName) {

			case BlockchainName.BITCOIN : {
				return new Transaction();
			}

			case BlockchainName.ETHEREUM : {
				return await this.ethereumContractService.createTokenTransaction(
					tokenName as EthereumTokenName,
					to,
					amount,
					this.withdrawWallets[blockchainName]
				)
			}

			case BlockchainName.TRON : {
				return await this.tronContractService.createTokenTransaction(
					tokenName as TronTokenName,
					to,
					amount,
					this.withdrawWallets[blockchainName]
				)

			}

		}

	}


}
