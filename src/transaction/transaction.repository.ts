import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { Repository } from '../_common/repository';
import { Transaction, TransactionDocument } from './transaction.model';

@Injectable()
export class TransactionsRepository extends Repository<Transaction, TransactionDocument>{

    constructor(
        @InjectModel(Transaction.name) protected readonly mongoModel: Model<TransactionDocument>) {
        super(mongoModel);
    }

    async safeSave(transaction: Transaction): Promise<Transaction> {
        if(transaction.hash) {
            let isExists = await this.exists({
                hash : transaction.hash
            });
            if(isExists) {
                return;// this.update(transaction);
            }
        }
        return this.save(transaction);
    }

    async findByTxHash(blockchainName : Transaction["blockchainName"], hash: Transaction["hash"]) : Promise<Transaction> {
        return await this.findOne({ 
            blockchainName : blockchainName,
            hash : hash
        });
    }

}