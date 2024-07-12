import { Module } from '@nestjs/common';
import { EthereumService } from './ethereum.service';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
    imports: [WalletModule],
    exports: [EthereumService],
    providers: [
        EthereumService],
    controllers: [],
})
export class EthereumModule { }
