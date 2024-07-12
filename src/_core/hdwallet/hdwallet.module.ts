import { Module } from '@nestjs/common';
import { HDWalletService } from './hdwallet.service';
 
@Module({
  imports: [],
  exports: [HDWalletService],
  providers: [
    HDWalletService],
  controllers: [],
})
export class HDWalletModule {}
