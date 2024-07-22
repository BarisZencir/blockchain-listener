import { Body, Controller, Logger, Post, UseFilters, UseGuards } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { BlockchainName } from "src/_common/enums/blockchain.name.enums";
import { Transaction } from "./transaction.model";
import { NetworkService } from "src/networks/network.service";
import { StartWithdrawRequest } from "./dto/transaction.request.dto";

@Controller('transaction')
export class TransactionController {

    private readonly logger = new Logger(TransactionController.name);
    constructor(
        private transactionService : TransactionService,
        private networkService : NetworkService
        ) {
    }

    @Post("startWithdraw")
    async startWithdraw(
        @Body() request: StartWithdrawRequest
    ): Promise<boolean> {

        this.logger.debug("getFreeAddress started.");

        let isExistRequestId = await this.transactionService.exists({
            withdrawRequestId : request.requestId
        });

        if(isExistRequestId) {
            throw Error("this requestId exists.");
        }
        let transaction = new Transaction();
        transaction.withdrawRequestId = request.requestId;
        let result = this.networkService.createTransaction(transaction, request.blockchainName, request.to, request.amounth);
        
        this.logger.debug("getFreeAddress done.");
        return true;
    }

}
