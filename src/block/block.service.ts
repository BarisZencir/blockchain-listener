import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Service } from '../_common/service';
import { Block, BlockDocument } from './block.model';
import { BlocksRepository } from './block.repository';


@Injectable()
export class BlockService extends Service<Block, BlockDocument, BlocksRepository> implements OnModuleInit {

    private readonly logger = new Logger(BlockService.name);

    constructor(
        protected repository: BlocksRepository,
    ) {
        super(repository);
    }

    async onModuleInit() : Promise<void> {
    }

}
