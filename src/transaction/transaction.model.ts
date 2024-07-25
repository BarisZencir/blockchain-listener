import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseModel, createSchema } from '../_common/model/base.model';
import { TransactionState, TransactionType } from './enum/transaction.state';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { ITransferEvent } from 'src/networks/ethereum/ethereum.contract.service';

export type TransactionDocument = Transaction & Document;

@Schema()
export class Transaction extends BaseModel {

	@Prop({
		enum: TransactionState,
		default: TransactionState.REQUESTED
	})
	state: TransactionState;
	
	@Prop({
		enum: TransactionType,
		default : TransactionType.NOT_KNOWN,
		required : true
	})
	type: TransactionType;

	@Prop({
		enum : BlockchainName,
		required: true})
	blockchainName: BlockchainName;

	@Prop({required: false})
	withdrawRequestId: string;

	@Prop({required: false})
	tokenName: string;

	@Prop()
	hash: string;

	@Prop()
	data: string;
	
	@Prop({default : false})
	hasError: boolean;

	@Prop({default : false})
	isRead: boolean;

	@Prop()
	error: string;

	@Prop()
	event: string;

	@Prop()
	from: string;

	@Prop()
	to: string;

	//not bu amount fee icermeyecek dedik oyle basladik.
	@Prop()
	amount: string; // kusurat cok napalim, string tuttum ama sorun bu. 

	@Prop()
	estimatedAmount: string; // kusurat cok napalim, string tuttum ama sorun bu. 

	@Prop()
	fee: string; // kusurat cok napalim, string tuttum ama sorun bu. 

	@Prop()
	estimatedFee: string; // kusurat cok napalim, string tuttum ama sorun bu. 

	@Prop()
	requestedBlockNumber: string;

	@Prop()
	processedBlockNumber: string;

	@Prop()
	complatedBlockNumber: string;
	
}

export const TransactionSchema = createSchema(Transaction);