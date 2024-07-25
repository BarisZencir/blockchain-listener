import { Module } from '@nestjs/common';
import { BitcoinModule } from './bitcoin/bitcoin.module';
import { EthereumModule } from './ethereum/ethereum.module';
import { TronModule } from './tron/tron.module';
import { NetworkService } from './network.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { AvalancheModule } from './avalanche/avalanche.module';

@Module({
    imports: [WalletModule, BitcoinModule, EthereumModule, TronModule, AvalancheModule],
    exports: [NetworkService],
    providers: [NetworkService],
    controllers: [],
})
export class NetworkModule { }
