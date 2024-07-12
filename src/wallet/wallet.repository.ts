import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { Repository } from '../_common/repository';
import { Wallet, WalletDocument } from './wallet.model';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';

@Injectable()
export class WalletsRepository extends Repository<Wallet, WalletDocument>{

    constructor(
        @InjectModel(Wallet.name) protected readonly mongoModel: Model<WalletDocument>) {
        super(mongoModel);
    }

    async findNextFreeAddress(blockchainName : BlockchainName) : Promise<Wallet> {
        return this.mongoModel.findOne({ 
            blockchainName : blockchainName,
            available: true })
        .sort({ index: 1 })
        .lean();
    }
}