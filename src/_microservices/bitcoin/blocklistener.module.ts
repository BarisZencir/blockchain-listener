import { Module } from '@nestjs/common';
import { BlockModule } from 'src/block/block.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { BlockListenerScheduler } from './blocklistener.scheduler';
import { BlockListenerService } from './blocklistener.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/_common/_config/configuration';
import { DefaultLoggerModule } from 'src/_common/_logger/default.logger.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HDWalletModule } from 'src/_core/hdwallet/hdwallet.module';
import { BitcoinModule } from 'src/networks/bitcoin/bitcoin.module';
import { UtxoModule } from 'src/utxo/utxo.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            isGlobal: true,
        }),
        DefaultLoggerModule,
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGO_PATH'),
            }),
            inject: [ConfigService],
        }),
        ScheduleModule.forRoot(),
        BlockModule,
        WalletModule,
        UtxoModule,
        TransactionModule,
        HDWalletModule,
        BitcoinModule],
    controllers: [],
    providers: [BlockListenerService, BlockListenerScheduler],
})
export class BlockListenerModule { }