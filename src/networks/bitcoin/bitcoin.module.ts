import { Module } from '@nestjs/common';
import { BitcoinService } from './bitcoin.service';
import { UtxoModule } from 'src/utxo/utxo.module';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
    imports: [UtxoModule, WalletModule],
    exports: [BitcoinService],
    providers: [
        BitcoinService],
    controllers: [],
})
export class BitcoinModule { }
