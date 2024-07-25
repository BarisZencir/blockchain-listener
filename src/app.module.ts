import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DefaultLoggerModule } from './_common/_logger/default.logger.module';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './_common/_config/configuration';

import { AppService } from './app.service';
import { AppTasksService } from './app.task.service';
import { BlockModule } from './block/block.module';
import { TransactionModule } from './transaction/transaction.module';
import { WalletModule } from './wallet/wallet.module';
import { HDWalletModule } from './_core/hdwallet/hdwallet.module';
import { UtxoModule } from './utxo/utxo.module';
import { EthereumModule } from './networks/ethereum/ethereum.module';
import { TronModule } from './networks/tron/tron.module';
import { BitcoinModule } from './networks/bitcoin/bitcoin.module';
import { CoreModule } from './_core/core.module';
import { AppTestController } from './app.test.controller';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './_core/guards/api-key.guard';
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
        CoreModule,
        ScheduleModule.forRoot(),
        BlockModule,
        WalletModule,
        UtxoModule,
        TransactionModule,
        HDWalletModule,
        BitcoinModule,
        EthereumModule,
        TronModule
    ],
    controllers: [AppTestController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ApiKeyGuard,
        },
        AppService, AppTasksService, AppTestController],
})
export class AppModule { }
