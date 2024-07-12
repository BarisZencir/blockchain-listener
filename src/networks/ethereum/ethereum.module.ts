import { Module } from '@nestjs/common';
import { EthereumService } from './ethereum.service';
 
@Module({
  imports: [],
  exports: [EthereumService],
  providers: [
    EthereumService],
  controllers: [],
})
export class EthereumModule {}
