import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseModel, createSchema } from '../_common/model/base.model';

export type BlockDocument = Block & Document;

@Schema()
export class Block extends BaseModel {

	@Prop({required: true, unique : true})
	blockchainName: string;

	@Prop()
	blockNumber: number;
}

export const BlockSchema = createSchema(Block);