
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { TransactionState, TransactionType } from '../enum/transaction.state';
import { Transaction } from '../transaction.model';


export class CreateWithdrawTransactionRequest {
    requestId : string;
    blockchainName : BlockchainName;
    tokenName? : string;
    to : string;
    amounth : string;
}

export class GetNotReadTransactionsRequest {
    states? : TransactionState[];
    types? : TransactionType[];
    hasErrors? : boolean[];
    isReads? : boolean[];
    blockchainName? : BlockchainName[];
    tokenName? : string[];
    limit: number;

}

export class UpdateTransactionAsReadRequest {
    id : Transaction["id"];
}