import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseModel, createSchema } from '../_common/model/base.model';

export type BlockDocument = Block & Document;

@Schema()
export class Block extends BaseModel {

	@Prop({required: true})
	blockchainName: string;

	@Prop()
	blockNumber: string;

	//main netlerde bu deger -1, token group listenerde listener index.
	@Prop({required: true, default : -1})
	groupIndex: number;

}

export const BlockSchema = createSchema(Block);