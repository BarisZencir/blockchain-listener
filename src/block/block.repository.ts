import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { Repository } from '../_common/repository';
import { Block, BlockDocument } from './block.model';

@Injectable()
export class BlocksRepository extends Repository<Block, BlockDocument>{

    constructor(
        @InjectModel(Block.name) protected readonly mongoModel: Model<BlockDocument>) {
        super(mongoModel);
    }
}