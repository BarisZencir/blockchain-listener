import { Module } from '@nestjs/common';
import { AvalancheService } from './avalanche.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { AvalancheContractService } from './avalanche.contract.service';

@Module({
    imports: [WalletModule],
    exports: [AvalancheService, AvalancheContractService],
    providers: [
        AvalancheService, AvalancheContractService],
    controllers: [],
})
export class AvalancheModule { }
