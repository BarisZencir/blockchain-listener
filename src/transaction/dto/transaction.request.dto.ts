
import { IsArray, IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { TransactionState, TransactionType } from '../enum/transaction.state';
import { Transaction } from '../transaction.model';


export class CreateWithdrawTransactionRequest {
    @IsString()    
    requestId : string;

    @IsEnum(BlockchainName)
    blockchainName : BlockchainName;

    @IsString()    
    tokenName? : string;

    @IsString()    
    to : string;

    @IsString()    
    amounth : string;
}

export class GetNotReadTransactionsRequest {

    @IsOptional()
    @IsArray()
    states? : TransactionState[];

    @IsOptional()
    @IsArray()
    types? : TransactionType[];

    @IsOptional()
    @IsArray()
    hasErrors? : boolean[];

    @IsOptional()
    @IsArray()
    isReads? : boolean[];

    @IsOptional()
    @IsArray()
    blockchainName? : BlockchainName[];

    @IsOptional()
    @IsArray()
    tokenName? : string[];

    @IsOptional()
    @IsNumber()
    limit?: number;

}

export class UpdateTransactionAsReadRequest {
    @IsString() 
    id : Transaction["id"];
}