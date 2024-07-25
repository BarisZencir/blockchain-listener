import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Service } from '../_common/service';
import { Transaction, TransactionDocument } from './transaction.model';
import { TransactionsRepository } from './transaction.repository';
import { TransactionService } from './transaction.service';


@Injectable()
export class TransactionsControllerService extends TransactionService {

    protected readonly logger = new Logger(TransactionsControllerService.name);

    constructor(
        protected repository: TransactionsRepository,
    ) {
        super(repository);
    }

    async onModuleInit() : Promise<void> {
        await super.onModuleInit();
    }
}
