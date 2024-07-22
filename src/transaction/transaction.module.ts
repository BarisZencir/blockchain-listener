import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './transaction.model';
import { TransactionService } from './transaction.service';
import { TransactionsRepository } from './transaction.repository';
import { TransactionController } from './transaction.controller';
import { NetworkModule } from 'src/networks/network.module';
 
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }],),
    NetworkModule
  ],
  exports: [TransactionService],
  providers: [
    TransactionsRepository, 
    TransactionService],
  controllers: [TransactionController],
})
export class TransactionModule {}
