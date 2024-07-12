import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Wallet } from 'ethers';
import { BlockService } from 'src/block/block.service';
import { BitcoinService } from 'src/networks/bitcoin/bitcoin.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class BlockListenerService implements OnModuleInit {

    private readonly logger = new Logger(BlockListenerService.name);

    constructor(
        private readonly blockService: BlockService,
        private readonly walletService: WalletService,
        private readonly transactionService: TransactionService,
        private readonly bitcoinService: BitcoinService

    ) { }

    async onModuleInit(): Promise<void> {

    }
}
