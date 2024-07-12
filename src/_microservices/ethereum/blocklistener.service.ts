import { Injectable, OnModuleInit } from '@nestjs/common';
import { Wallet } from 'ethers';
import { BlockService } from 'src/block/block.service';
import { EthereumService } from 'src/networks/ethereum/ethereum.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class BlockListenerService implements OnModuleInit {

  constructor(
    private readonly blockService : BlockService,
    private readonly walletService : WalletService,
    private readonly transactionService : TransactionService,
    private readonly ethereumService : EthereumService

  ) {}

  async onModuleInit() : Promise<void> {

  }
}
