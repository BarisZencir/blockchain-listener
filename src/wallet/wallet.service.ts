import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Service } from '../_common/service';
import { TokenBalance, Wallet, WalletDocument } from './wallet.model';
import { WalletsRepository } from './wallet.repository';
import { HDWalletService } from 'src/_core/hdwallet/hdwallet.service';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class WalletService extends Service<Wallet, WalletDocument, WalletsRepository> implements OnModuleInit {

    private readonly logger = new Logger(WalletService.name);

    private availableWalletAddresses : {
        [BlockchainName.BITCOIN_TEST] : Wallet["address"][],
        [BlockchainName.ETHEREUM_TEST] : Wallet["address"][],
    }

    constructor(
        protected repository: WalletsRepository,
        private configService: ConfigService,
        private hdWalletService : HDWalletService,
    ) {
        super(repository);
    }

    async onModuleInit() : Promise<void> {
        let mnemonic : string;
        let numberOfAddresses = this.configService.get<number>("HOT_WALLET_NUMBER_OF_ADDRESSES");

        let walletList = Array<Wallet>();

        let isExistsBTCAddresses = await this.repository.exists({blockchainName : BlockchainName.BITCOIN_TEST});
        if(!isExistsBTCAddresses) {

            if(numberOfAddresses <= 0) {
                this.logger.warn("Pls enter HOT_WALLET_NUMBER_OF_ADDRESSES to .env file.")
            }
            
            //burada default init.
            mnemonic = this.configService.get<string>("HOT_WALLET_BTC_MNEMONIC");
            if('undefined' != typeof mnemonic) {
                let addresses = this.hdWalletService.generateAddresses(BlockchainName.BITCOIN_TEST, mnemonic, numberOfAddresses);
                addresses.forEach(address => {
                    let wallet = new Wallet();
                    wallet.blockchainName = BlockchainName.BITCOIN_TEST;
                    wallet.index = address.index;
                    wallet.nonce = 0;
                    wallet.privateKey = address.privateKey;
                    wallet.publicKey = address.publicKey;
                    wallet.address = address.address;
                    wallet.available = wallet.index == 0 ? false : true;
                    wallet.balance = "0";
                    wallet.tokenBalance = new Array<TokenBalance>();
                    walletList.push(wallet);
                });

            } else {
                this.logger.warn("btc mnemonic can not found. Pls enter HOT_WALLET_BTC_MNEMONIC to .env file.")
            }
        }
        
        let isExistsETHAddresses = await this.repository.exists({blockchainName : BlockchainName.ETHEREUM_TEST});
        if(!isExistsETHAddresses) {

            if(numberOfAddresses <= 0) {
                this.logger.warn("Pls enter HOT_WALLET_NUMBER_OF_ADDRESSES to .env file.")
            }
            
            //burada default init.
            mnemonic = this.configService.get<string>("HOT_WALLET_ETH_MNEMONIC");
            if('undefined' != typeof mnemonic) {
                let addresses = this.hdWalletService.generateAddresses(BlockchainName.ETHEREUM_TEST, mnemonic, numberOfAddresses);
                addresses.forEach(address => {
                    let wallet = new Wallet();
                    wallet.blockchainName = BlockchainName.ETHEREUM_TEST;
                    wallet.index = address.index;
                    wallet.nonce = 0;
                    wallet.privateKey = address.privateKey;
                    wallet.publicKey = address.publicKey;
                    wallet.address = address.address;
                    wallet.available = wallet.index == 0 ? false : true;
                    wallet.balance = "0";
                    wallet.tokenBalance = new Array<TokenBalance>();
                    walletList.push(wallet);
                });

            } else {
                this.logger.warn("eth mnemonic can not found. Pls enter HOT_WALLET_ETH_MNEMONIC to .env file.")
            }
        }
        

        //TODO: bunu bulk ile yapalim.
        //base repoya o metod eklenecek.
        for(let i = 0; i < walletList.length; i++) {
            let wallet = walletList[i];
            await this.repository.save(wallet);
        }

        let availableBTCWallets = await this.repository.find({
            blockchainName : BlockchainName.BITCOIN_TEST,
            available : true
        });

        let availableETHWallets = await this.repository.find({
            blockchainName : BlockchainName.ETHEREUM_TEST,
            available : true
        });

        // this.availableWalletAddresses = {
        //     BITCOIN_TEST  : new Array<Wallet["address"]>(),
        //     ETHEREUM_TEST : new Array<Wallet["address"]>()
        // }

        this.availableWalletAddresses = {
            BITCOIN_TEST  : availableBTCWallets.map(wallet => wallet.address),
            ETHEREUM_TEST : availableETHWallets.map(wallet => wallet.address)
        }

    }

    async findNextAvailableAddressAndUpdate(blockchainName : BlockchainName) : Promise<Wallet> {
        
        if(!(this.availableWalletAddresses[blockchainName].length > 0)) {
            return null;
        }

        let address = this.availableWalletAddresses[blockchainName].shift();

        let wallet = await this.repository.findOne({
            blockchainName : blockchainName,
            address: address});

        wallet.available = false;
        await this.repository.update(wallet);

        return wallet;
    }


    async findNextFreeAddress(blockchainName : BlockchainName) : Promise<Wallet> {
        return this.repository.findNextFreeAddress(blockchainName);

    }

}
