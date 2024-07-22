import { Body, Controller, Logger, Post, UseFilters, UseGuards } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { BlockchainName } from "src/_common/enums/blockchain.name.enums";
import { Transaction } from "./transaction.model";
import { NetworkService } from "src/networks/network.service";
import { CreateWithdrawTransactionRequest, GetNotReadTransactionsRequest, UpdateTransactionAsReadRequest } from "./dto/transaction.request.dto";
import { CreateWithdrawTransactionResponse, GetNotReadTransactionsResponseItem, UpdateTransactionAsReadResponse } from "./dto/transaction.response.dto";

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
    ): Promise<CreateWithdrawTransactionResponse> {

        this.logger.debug("createWithdrawTransaction started. params: " + JSON.stringify(request));

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
        transaction = await this.transactionService.save(transaction);

        let isNetworkReturnSuccess = transaction.hasError != true;
        this.logger.debug("createWithdrawTransaction done. id: " + transaction.id + " isNetworkReturnSuccess : " + isNetworkReturnSuccess);
        return {
            id : transaction.id,
            isNetworkReturnSuccess : isNetworkReturnSuccess
        };
    }


    //note:default limit: 10
    @Post("getNotReadTransactions")
    async getNotReadTransactions(
        @Body() request: GetNotReadTransactionsRequest
    ): Promise<GetNotReadTransactionsResponseItem[]> {

        this.logger.debug("getNotReadTransactions started. params: " + JSON.stringify(request));
        let filter : any = {};

        if(request.states && request.states.length) {
            filter.state = {$in : request.states};
        }

        if(request.types && request.types.length) {
            filter.type = {$in : request.types};
        }

        if(request.hasErrors && request.hasErrors.length) {
            filter.hasError = {$in : request.hasErrors};
        }

        if(request.isReads && request.isReads.length) {
            filter.isRead = {$in : request.isReads};
        }

        if(request.blockchainName && request.blockchainName.length) {
            filter.blockchainName = {$in : request.blockchainName};
        }

        if(request.tokenName && request.tokenName.length) {
            filter.tokenName = {$in : request.tokenName};
        }

        //max 100 tane getirsin.
        let transactions = await this.transactionService.findByLimit(filter, request.limit || 10);

        let response = new Array<GetNotReadTransactionsResponseItem>();
        transactions.forEach(transaction => {
            response.push({
                id : transaction.id,
                state : transaction.state,
                type : transaction.type,
                blockchainName : transaction.blockchainName,
                withdrawRequestId : transaction.withdrawRequestId,
                tokenName : transaction.tokenName,
                hash : transaction.hash,
                hasError : transaction.hasError,
                isRead : transaction.isRead,
                from : transaction.from,
                to : transaction.to,
                amount : transaction.amount,
                fee : transaction.fee,
                requestedBlockNumber : transaction.requestedBlockNumber,
                processedBlockNumber : transaction.processedBlockNumber,
                complatedBlockNumber : transaction.complatedBlockNumber
                
            });
        });

        this.logger.debug("getNotReadTransactions done. count: " + response.length);
        return response;
    }

    
    //note:default limit: 10
    @Post("updateTransactionAsRead")
    async updateTransactionAsRead(
        @Body() request: UpdateTransactionAsReadRequest
    ): Promise<UpdateTransactionAsReadResponse> {

        this.logger.debug("updateTransactionAsRead started. params: " + JSON.stringify(request));
        let transaction = await this.transactionService.findOne({
            id : request.id
        });
        
        if(!transaction) {
            throw Error("there is no transaction");            
        }

        if(transaction.isRead) {
            return {
                id : transaction.id,
                isUpdatedSuccessfully : false
            };
        }

        
        transaction.isRead = true;
        await this.transactionService.update(transaction);

        this.logger.debug("updateTransactionAsRead done. id: " + transaction.id);
        return {
            id : transaction.id,
            isUpdatedSuccessfully : true
        };

    }

}
