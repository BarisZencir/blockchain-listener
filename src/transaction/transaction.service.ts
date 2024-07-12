import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Service } from '../_common/service';
import { Transaction, TransactionDocument } from './transaction.model';
import { TransactionsRepository } from './transaction.repository';


@Injectable()
export class TransactionService extends Service<Transaction, TransactionDocument, TransactionsRepository> implements OnModuleInit {

    private readonly logger = new Logger(TransactionService.name);

    constructor(
        protected repository: TransactionsRepository,
    ) {
        super(repository);
    }

    async onModuleInit() : Promise<void> {
    }

    async findByTxHash(blockchainName : Transaction["blockchainName"], hash: Transaction["hash"]) : Promise<Transaction> {
        return this.repository.findByTxHash(blockchainName, hash);
    }

}
