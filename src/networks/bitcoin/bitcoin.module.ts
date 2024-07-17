import { Module } from '@nestjs/common';
import { BitcoinService } from './bitcoin.service';
import { UtxoModule } from 'src/utxo/utxo.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
    imports: [UtxoModule, WalletModule, TransactionModule],
    exports: [BitcoinService],
    providers: [
        BitcoinService],
    controllers: [],
})
export class BitcoinModule { }
