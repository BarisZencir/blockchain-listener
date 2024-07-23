import { Transaction } from "../transaction.model";


export class CreateWithdrawTransactionResponse {

    id : Transaction["id"];
    isNetworkReturnSuccess : boolean;
}

export class GetNotReadTransactionsResponseItem {

    id : Transaction["id"];
    state : Transaction["state"];
    type : Transaction["type"];
    blockchainName : Transaction["blockchainName"];
    withdrawRequestId : Transaction["withdrawRequestId"];
    tokenName? : Transaction["tokenName"];
    hash : Transaction["hash"];
    hasError : Transaction["hasError"];
    isRead : Transaction["isRead"];
    from : Transaction["from"];
    to : Transaction["to"];
    amount : Transaction["amount"];
    fee : Transaction["fee"];
    requestedBlockNumber : Transaction["requestedBlockNumber"];
    processedBlockNumber : Transaction["processedBlockNumber"];
    complatedBlockNumber : Transaction["complatedBlockNumber"];
}

export class UpdateTransactionAsReadResponse {
    id : Transaction["id"];
    isUpdatedSuccessfully : boolean;

}