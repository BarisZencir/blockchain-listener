import { Module } from '@nestjs/common';
import { BlockModule } from 'src/block/block.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { BlockListenerService } from './blocklistener.service';
import { BlockListenerScheduler } from './blocklistener.scheduler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/_common/_config/configuration';
import { DefaultLoggerModule } from 'src/_common/_logger/default.logger.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HDWalletModule } from 'src/_core/hdwallet/hdwallet.module';
import { TronModule } from 'src/networks/tron/tron.module';

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
        TransactionModule,
        HDWalletModule,
        TronModule],
    controllers: [],
    providers: [BlockListenerService, BlockListenerScheduler],
})
export class BlockListenerModule { }