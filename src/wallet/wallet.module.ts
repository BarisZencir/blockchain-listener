import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './wallet.model';
import { WalletService } from './wallet.service';
import { WalletsRepository } from './wallet.repository';
import { HDWalletModule } from 'src/_core/hdwallet/hdwallet.module';
import { WalletController } from './wallet.controller';
 
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    HDWalletModule
  ],
  exports: [WalletService],
  providers: [
    WalletsRepository, 
    WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
