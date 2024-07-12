import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseModel, createSchema } from '../_common/model/base.model';
import { TransactionState, TransactionType } from './enum/transaction.state';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';

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
		required : true
	})
	type: TransactionType;

	@Prop({
		enum : BlockchainName,
		required: true})
	blockchainName: BlockchainName;

	@Prop({required: false})
	tokenName: string;

	@Prop()
	txHash: string;

	@Prop()
	txData: string;

	@Prop()
	txError: string;

	@Prop()
	from: string;

	@Prop()
	to: string;

	//not bu amount fee icermeyecek dedik oyle basladik.
	@Prop()
	amount: string; // kusurat cok napalim, string tuttum ama sorun bu. 

	@Prop()
	fee: string; // kusurat cok napalim, string tuttum ama sorun bu. 

	@Prop()
	requestedBlockNumber: number;

	@Prop()
	processedBlockNumber: number;

	@Prop()
	complatedBlockNumber: number;
	
}

export const TransactionSchema = createSchema(Transaction);