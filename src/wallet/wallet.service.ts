import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Service } from '../_common/service';
import { TokenBalance, Wallet, WalletDocument } from './wallet.model';
import { WalletRepository } from './wallet.repository';
import { HDWalletService } from 'src/_core/hdwallet/hdwallet.service';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WalletService extends Service<Wallet, WalletDocument, WalletRepository> implements OnModuleInit {

    private readonly logger = new Logger(WalletService.name);
    private crypDx = {
        secret : null,
        algorithm : 'aes-256-cbc',
        key : null,
        iv : null

    };

    private availableWalletAddresses : {
        [BlockchainName.BITCOIN] : Wallet["address"][],
        [BlockchainName.ETHEREUM] : Wallet["address"][],
        [BlockchainName.TRON] : Wallet["address"][],
    }

    constructor(
        protected repository: WalletRepository,
        private configService: ConfigService,
        private hdWalletService : HDWalletService,
    ) {
        super(repository);
    }

    private encrypt(text : string) : string {
        if(this.crypDx.iv) {
            const cipher = crypto.createCipheriv(this.crypDx.algorithm, this.crypDx.key, this.crypDx.iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return `${this.crypDx.iv.toString('hex')}:${encrypted}`;
        }
        return text;
    }
      
    private  decrypt(encrypted: string) : string {
        if(this.crypDx.iv) {
            const [ivText, encryptedText] = encrypted.split(':');
            const ivBuffer = Buffer.from(ivText, 'hex');
            const decipher = crypto.createDecipheriv(this.crypDx.algorithm, this.crypDx.key, ivBuffer);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;    
        }
        return encrypted;
    }

    async onModuleInit() : Promise<void> {

        // process.argv'dan parametreleri al
        const args = process.argv.slice(2);        
        args.forEach((arg) => {
        const [key, value] = arg.split('=');
            if (key === '--WLT_SCR') {
                this.crypDx.secret = value;
            }
        });

        console.log('secret :', this.crypDx.secret);

        if(this.crypDx.secret) {
            this.crypDx.key = crypto.scryptSync(this.crypDx.secret, 'salt', 32);
            this.crypDx.iv = crypto.randomBytes(16);
        }

        let mnemonic : string;
        let numberOfAddresses = this.configService.get<number>("wallet.numberOfAddresses");

        let walletList = Array<Wallet>();

        //testing
        // mnemonic = this.configService.get<string>("HOT_WALLET_BTC_MNEMONIC");
        // let addressesTest = this.hdWalletService.generateAddresses(BlockchainName.BITCOIN, mnemonic, numberOfAddresses);
        // for(let i = 0; i < 10; i++) {
        //     console.log(addressesTest[i].address + "    "  + addressesTest[i].privateKey);
        // }
        // let addressesTest = this.hdWalletService.generateAddresses(BlockchainName.TRON, "swap awful artwork exchange arctic slide under subway interest theme garden desk", numberOfAddresses);
        // for(let i = 0; i < 10; i++) {
        //     console.log(addressesTest[i].address + "    "  + addressesTest[i].privateKey);
        // }

        let isExistsBTCAddresses = await this.repository.exists({blockchainName : BlockchainName.BITCOIN});
        if(!isExistsBTCAddresses) {

            if(numberOfAddresses <= 0) {
                this.logger.warn("Pls enter HOT_WALLET_NUMBER_OF_ADDRESSES to .env file.")
            }
            
            //burada default init.
            mnemonic = this.configService.get<string>("HOT_WALLET_BTC_MNEMONIC");
            if('undefined' != typeof mnemonic) {
                let addresses = this.hdWalletService.generateAddresses(BlockchainName.BITCOIN, mnemonic, numberOfAddresses);
                addresses.forEach(address => {
                    let wallet = new Wallet();
                    wallet.blockchainName = BlockchainName.BITCOIN;
                    wallet.index = address.index;
                    wallet.nonce = 0;
                    wallet.privateKey = this.encrypt(address.privateKey);
                    wallet.publicKey = address.publicKey;
                    wallet.address = address.address.toLowerCase();
                    wallet.available = wallet.index == 0 ? false : true;
                    // wallet.estimatedBalance = "0";
                    // wallet.tokenBalance = new Array<TokenBalance>();
                    walletList.push(wallet);
                });

            } else {
                this.logger.warn("btc mnemonic can not found. Pls enter HOT_WALLET_BTC_MNEMONIC to .env file.")
            }
        }
        
        let isExistsETHAddresses = await this.repository.exists({blockchainName : BlockchainName.ETHEREUM});
        if(!isExistsETHAddresses) {

            if(numberOfAddresses <= 0) {
                this.logger.warn("Pls enter HOT_WALLET_NUMBER_OF_ADDRESSES to .env file.")
            }
            
            //burada default init.
            mnemonic = this.configService.get<string>("HOT_WALLET_ETH_MNEMONIC");
            if('undefined' != typeof mnemonic) {
                let addresses = this.hdWalletService.generateAddresses(BlockchainName.ETHEREUM, mnemonic, numberOfAddresses);
                addresses.forEach(address => {
                    let wallet = new Wallet();
                    wallet.blockchainName = BlockchainName.ETHEREUM;
                    wallet.index = address.index;
                    wallet.nonce = 0;
                    wallet.privateKey = this.encrypt(address.privateKey);
                    wallet.publicKey = address.publicKey;
                    wallet.address = address.address.toLowerCase();
                    wallet.available = wallet.index == 0 ? false : true;
                    // wallet.estimatedBalance = "0";
                    // wallet.tokenBalance = new Array<TokenBalance>();
                    walletList.push(wallet);
                });

            } else {
                this.logger.warn("eth mnemonic can not found. Pls enter HOT_WALLET_ETH_MNEMONIC to .env file.")
            }
        }
        
        let isExistsTRXAddresses = await this.repository.exists({blockchainName : BlockchainName.TRON});
        if(!isExistsTRXAddresses) {

            if(numberOfAddresses <= 0) {
                this.logger.warn("Pls enter HOT_WALLET_NUMBER_OF_ADDRESSES to .env file.")
            }
            
            //burada default init.
            mnemonic = this.configService.get<string>("HOT_WALLET_TRX_MNEMONIC");
            if('undefined' != typeof mnemonic) {
                let addresses = this.hdWalletService.generateAddresses(BlockchainName.TRON, mnemonic, numberOfAddresses);
                addresses.forEach(address => {
                    let wallet = new Wallet();
                    wallet.blockchainName = BlockchainName.TRON;
                    wallet.index = address.index;
                    wallet.nonce = 0;
                    wallet.privateKey = this.encrypt(address.privateKey);
                    wallet.publicKey = address.publicKey;
                    wallet.address = address.address;
                    wallet.available = wallet.index == 0 ? false : true;
                    // wallet.estimatedBalance = "0";
                    // wallet.tokenBalance = new Array<TokenBalance>();
                    walletList.push(wallet);
                });

            } else {
                this.logger.warn("trx mnemonic can not found. Pls enter HOT_WALLET_TRX_MNEMONIC to .env file.")
            }
        }
        
        //TODO: bunu bulk ile yapalim.
        //base repoya o metod eklenecek.
        for(let i = 0; i < walletList.length; i++) {
            let wallet = walletList[i];
            await this.repository.save(wallet);
        }

        let availableBTCWallets = await this.repository.find({
            blockchainName : BlockchainName.BITCOIN,
            available : true
        });

        let availableETHWallets = await this.repository.find({
            blockchainName : BlockchainName.ETHEREUM,
            available : true
        });

        let availableTRXWallets = await this.repository.find({
            blockchainName : BlockchainName.TRON,
            available : true
        });

        // this.availableWalletAddresses = {
        //     BITCOIN  : new Array<Wallet["address"]>(),
        //     ETHEREUM : new Array<Wallet["address"]>()
        // }

        this.availableWalletAddresses = {
            BITCOIN  : availableBTCWallets.map(wallet => wallet.address),
            ETHEREUM : availableETHWallets.map(wallet => wallet.address),
            TRON : availableTRXWallets.map(wallet => wallet.address),
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

    async findByAddress(blockchainName : Wallet["blockchainName"], address: Wallet["address"]) : Promise<Wallet> {
        return this.repository.findByAddress(blockchainName, address);
    }


    async getWalletAsSigner(blockchainName : BlockchainName, index: number) : Promise<Wallet> {
        let wallet = await this.repository.findOne({
            blockchainName : blockchainName, 
            index : index
        });

        if(wallet) {
            wallet.privateKey = this.decrypt(wallet.privateKey);
        }
        return wallet;
    }

}
