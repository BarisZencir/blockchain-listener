####################################################
						API LIST
####################################################
1. header'a bir anahtar eklenecek.
2. basarili istek ornegi: {
    "statusCode": 200,
    "data": {
        "index": 2,
        "blockchainName": "BITCOIN",
        "address": "bcrt1ql6jkusduftgr5q06ghqsnxfrp2wkay77utl0kt"
    },
    "timestamp": "2024-07-23T08:54:47.468Z"
}

3. basarisiz istek ornegi
    3.1.parametre hatasi: {
        "statusCode": 400,
        "message": "{\"isEnum\":\"blockchainName must be one of the following values: BITCOIN, ETHEREUM, TRON\"} Validation failed",
        "timestamp": "2024-07-23T08:49:44.857Z"
    }
    3.2. Api apiError : {
        "statusCode": 555, //api errorlerde 555 doner hep.
        "apiErrorCode": 1001, //ayrica buradan hangi api error old takip edilebilir.
        "message": "There is no free wallet exists.",
        "timestamp": "2024-07-23T08:57:37.107Z"
    }
    3.3. Http error (like api error except statusCode diff.)

####################################################
URL/api/v1/wallet/getFreeAddress
####################################################
req: {
    blockchainName : BlockchainName;
}

res.data: {

    blockchainName : Wallet["blockchainName"];
    index: Wallet["index"];
    address : Wallet["address"];
}

apiErrors: NO_FREE_WALLET_EXISTS

####################################################
URL/api/v1/wallet/isAddressExist
####################################################

req: {
    blockchainName : BlockchainName;
}

res.data: boolean

apiErrors: 


####################################################
####################################################


####################################################
URL/api/v1/transaction/createWithdrawTransaction
####################################################

req: {
    requestId : string;
    blockchainName : BlockchainName;
    tokenName? : string;
    to : string;
    amount : string;
}

res.data: {
    id : Transaction["id"];
    isNetworkReturnSuccess : boolean;
}

apiErrors: REQUEST_ID_EXISTS


####################################################
URL/api/v1/transaction/getNotReadTransactions
####################################################

req: {
    states? : TransactionState[];
    types? : TransactionType[];
    hasErrors? : boolean[];
    isReads? : boolean[];
    blockchainName? : BlockchainName[];
    tokenName? : string[];
    limit?: number; // default 10 
}

res.data: [{

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
}]

apiErrors: 


####################################################
URL/api/v1/transaction/updateTransactionAsRead
####################################################

req: {
    id : Transaction["id"];
}

res.data: {
    id : Transaction["id"];
    isUpdatedSuccessfully : boolean;

}

apiErrors: 
