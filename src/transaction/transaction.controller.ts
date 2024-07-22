import { Body, Controller, Logger, Post, UseFilters, UseGuards } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { BlockchainName } from "src/_common/enums/blockchain.name.enums";
import { Transaction } from "./transaction.model";
import { NetworkService } from "src/networks/network.service";
import { CreateWithdrawTransactionRequest } from "./dto/transaction.request.dto";

@Controller('transaction')
export class TransactionController {

    private readonly logger = new Logger(TransactionController.name);
    constructor(
        private transactionService : TransactionService,
        private networkService : NetworkService
        ) {
    }

    @Post("createWithdrawTransaction")
    async createWithdrawTransaction(
        @Body() request: CreateWithdrawTransactionRequest
    ): Promise<boolean> {

        this.logger.debug("createWithdrawTransaction started.");

        let transaction : Transaction;
        let isExistRequestId = await this.transactionService.exists({
            withdrawRequestId : request.requestId
        });

        if(isExistRequestId) {
            throw Error("this requestId exists.");
        }
        
        if(request.tokenName) {
            transaction = await this.networkService.createTokenTransaction(request.blockchainName, request.tokenName, request.to, request.amounth);
        } else {
            transaction = await this.networkService.createTransaction(request.blockchainName, request.to, request.amounth);
        }
        transaction.withdrawRequestId = request.requestId;
        await this.transactionService.save(transaction);
        
        this.logger.debug("createWithdrawTransaction done.");
        return transaction.hasError != true;
    }

}
