import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseModel, createSchema } from '../_common/model/base.model';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { UtxoState } from './enum/utxo.state';

export type UtxoDocument = Utxo & Document;

@Schema()
export class Utxo extends BaseModel {

	@Prop({
		enum : BlockchainName,
		required: true})
	blockchainName: BlockchainName;

	@Prop({required: true})
	txid: string;

	@Prop({required: true})
	vout: number;

	@Prop({required: true})
	address: string;

	@Prop({required: true})
	scriptPubKey: string;

	@Prop({default : "0", required: true})
	amount: string;

	@Prop({
		enum: UtxoState,
		default: UtxoState.UN_SPENT
	})
	state: UtxoState;

	@Prop()
	estimatedUsedTxid: string;

	@Prop()
	usedTxid: string;

}

export const UtxoSchema = createSchema(Utxo);
