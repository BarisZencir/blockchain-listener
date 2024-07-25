import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './transaction.model';
import { TransactionService } from './transaction.service';
import { TransactionsRepository } from './transaction.repository';
import { TransactionController } from './transaction.controller';
import { NetworkModule } from 'src/networks/network.module';
import { TransactionsControllerService } from './transaction.controller.service';
 
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }],),
    NetworkModule
  ],
  exports: [],
  providers: [
    TransactionsRepository, 
    TransactionsControllerService],
  controllers: [TransactionController],
})
export class TransactionControllerModule {}
