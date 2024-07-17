import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EthereumHDWallet } from './lib/ethereum.hdwallet';
import { BitcoinHDWallet } from './lib/bitcoin.hdwallet';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { IAddressResult } from './address.result.interface';


@Injectable()
export class HDWalletService implements OnModuleInit {
	private readonly logger = new Logger(HDWalletService.name);

	constructor(
		private configService: ConfigService,
	) { }


	generateAddresses(blockchainName: BlockchainName, mnemonic : string, numberOfAddresses: number) : IAddressResult[] {

		if(blockchainName == BlockchainName.BITCOIN) {
			// derivePath: "m/84'/1'/0'/0",
			// networkName : "regtest"
			// derivePath: "m/84'/0'/0'/0",
			// networkName : "bitcoin"

			return (new BitcoinHDWallet(mnemonic, {
				derivePath: "m/84'/1'/0'/0",
				networkName : "regtest"
			})).generateAddresses(numberOfAddresses);
		}

		if(blockchainName == BlockchainName.ETHEREUM) {

			return (new EthereumHDWallet(mnemonic, {
				derivePath: "44'/60'/0'/0"
			})).generateAddresses(numberOfAddresses);
		}
	}

	async onModuleInit(): Promise<void> {
		// this.logger.log("Wallet service on module init started.");

		// this.logger.log("Wallet service test done.");

		// let mnemonic = "apart naive caution theme goat bulk kiwi merit world left frost spy";

		// let ethereumHdWallet = new EthereumHDWallet(mnemonic, {
		// 	derivePath: "44'/60'/0'/0"
		// });

		
		// let numberOfAddresses = 10;
		
		// let addresses = ethereumHdWallet.generateAddresses(numberOfAddresses);
		// for (let i = 0; i < addresses.length; i++) {
		// 	let address = addresses[i];
		// 	this.logger.log("eth-address-" + i + " : " + JSON.stringify(address));
		// }
		
		// let bitcoinHdWallet = new BitcoinHDWallet(mnemonic, {
		// 	derivePath: "m/44'/0'/0'/0"
		// });
		// addresses = bitcoinHdWallet.generateAddresses(numberOfAddresses);
		// for (let i = 0; i < addresses.length; i++) {
		// 	let address = addresses[i];
		// 	this.logger.log("btc-address-" + i + " : " + JSON.stringify(address));
		// }
	}

}
