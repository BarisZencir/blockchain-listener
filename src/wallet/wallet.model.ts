import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseModel, createSchema } from '../_common/model/base.model';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';

export type WalletDocument = Wallet & Document;
export type TokenBalanceDocument = TokenBalance & Document;

@Schema()
export class TokenBalance extends BaseModel {

	@Prop({required: true})
	tokenName: string;

	@Prop({default : "0", required: true})
	balance: string;
}

export const TokenBalanceSchema = createSchema(TokenBalance);

@Schema()
export class Wallet extends BaseModel {

	@Prop({
		enum : BlockchainName,
		required: true})
	blockchainName: BlockchainName;

	@Prop({required : true})
	index: number;

	@Prop({default : 0})
	nonce: number;

	@Prop()
	privateKey: string;

	@Prop()
	publicKey: string;

	@Prop()
	address: string;

	@Prop({default : true})
	available: boolean;

	@Prop({default : "0", required: true})
	balance: string;

	@Prop({ type: [TokenBalanceSchema], default: [] })
	tokenBalance: TokenBalance[];  

}

export const WalletSchema = createSchema(Wallet);