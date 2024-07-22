import { Module } from '@nestjs/common';
import { EthereumService } from './ethereum.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { EthereumContractService } from './ethereum.contract.service';

@Module({
    imports: [WalletModule],
    exports: [EthereumService, EthereumContractService],
    providers: [
        EthereumService, EthereumContractService],
    controllers: [],
})
export class EthereumModule { }
