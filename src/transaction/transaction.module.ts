import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './transaction.model';
import { TransactionService } from './transaction.service';
import { TransactionsRepository } from './transaction.repository';
 
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }],)
  ],
  exports: [TransactionService],
  providers: [
    TransactionsRepository, 
    TransactionService],
  controllers: [],
})
export class TransactionModule {}
