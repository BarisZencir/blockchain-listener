import { Module } from '@nestjs/common';
import { EthereumService } from './ethereum.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { EthereumContractService } from './ethereum.contract.service';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
    imports: [WalletModule, TransactionModule],
    exports: [EthereumService, EthereumContractService],
    providers: [
        EthereumService, EthereumContractService],
    controllers: [],
})
export class EthereumModule { }
