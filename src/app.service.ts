import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockService } from './block/block.service';
import { Block } from './block/block.model';
import { WalletService } from './wallet/wallet.service';
import { TransactionService } from './transaction/transaction.service';
import { TokenBalance, Wallet } from './wallet/wallet.model';
import { Transaction } from './transaction/transaction.model';
import { TransactionType } from './transaction/enum/transaction.state';
import { BlockchainName } from './_common/enums/blockchain.name.enums';
@Injectable()
export class AppService implements OnModuleInit {
    private readonly logger = new Logger(AppService.name);

    constructor(
        private configService: ConfigService,
        private blockService: BlockService,
        private walletService: WalletService,
        private transactionService: TransactionService
    ) { }

    async onModuleInit(): Promise<void> {
        this.logger.log("App service on module init started.");
        let configTest = this.configService.get<string>("config.test");
        let configTest2 = this.configService.get<string>("CONFIG_TEST");

        this.logger.log("configTest: " + configTest);

        this.logger.log("configTest: " + configTest2);

        // let currentBlock = await this.blockService.findOne({blockchainName : "Bitcoin"});
        // if(!currentBlock) {
        //   let block = new Block();
        //   block.blockNumber = 199;
        //   block.blockchainName = "Bitcoin";
        //   await this.blockService.save(block);
        // } else {
        //   currentBlock.blockNumber++;
        //   await this.blockService.update(currentBlock);
        // }

        // let wallet = new Wallet();
        // wallet.blockchainName = BlockchainName.BITCOIN;
        // wallet.index = 15;
        // wallet.privateKey = "asd";
        // wallet.tokenBalance = new Array<TokenBalance>();
        // let tokenBalance1 = new TokenBalance();
        // tokenBalance1.balance = "30.000";
        // tokenBalance1.tokenName = "tether";

        // let tokenBalance2 = new TokenBalance();
        // tokenBalance2.balance = "40.000";
        // tokenBalance2.tokenName = "npm";

        // wallet.tokenBalance.push(tokenBalance1);
        // wallet.tokenBalance.push(tokenBalance2);

        // await this.walletService.save(wallet);

        // let transaction = new Transaction();
        // transaction.blockchainName = BlockchainName.ETHEREUM;
        // transaction.type = TransactionType.DEPOSITE;
        // await this.transactionService.save(transaction);

        this.logger.log("App service test done.");

    }

    getHello(): string {
        return 'Hello World!';
    }
}
