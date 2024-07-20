import { Module } from '@nestjs/common';
import { TronService } from './tron.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { TronContractService } from './tron.contract.service';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
    imports: [WalletModule, TransactionModule],
    exports: [TronService, TronContractService],
    providers: [
        TronService, TronContractService],
    controllers: [],
})
export class TronModule { }
