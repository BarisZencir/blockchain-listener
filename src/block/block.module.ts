import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Block, BlockSchema } from './block.model';
import { BlockService } from './block.service';
import { BlocksRepository } from './block.repository';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Block.name, schema: BlockSchema }],)
    ],
    exports: [BlockService],
    providers: [
        BlocksRepository,
        BlockService],
    controllers: [],
})
export class BlockModule { }
