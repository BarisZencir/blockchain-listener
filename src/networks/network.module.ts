import { Module } from '@nestjs/common';
import { BitcoinModule } from './bitcoin/bitcoin.module';
import { EthereumModule } from './ethereum/ethereum.module';
import { TronModule } from './tron/tron.module';
import { NetworkService } from './network.service';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
    imports: [WalletModule, BitcoinModule, EthereumModule, TronModule],
    exports: [NetworkService],
    providers: [NetworkService],
    controllers: [],
})
export class NetworkModule { }
