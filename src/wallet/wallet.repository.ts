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

    async findNextFreeAddress(blockchainName : Wallet["blockchainName"]) : Promise<Wallet> {
        //note bu kod yanlis. findone kullanmadan yap. sanirim db'den sirayla cektigi icin sorun olmadi.
        return this.mongoModel.findOne({ 
            blockchainName : blockchainName,
            available: true })
        .sort({ index: 1 })
        .lean();
    }

    async findByAddress(blockchainName: Wallet["blockchainName"], address: Wallet["address"]): Promise<Wallet> {
        return this.mongoModel.findOne({ 
            blockchainName: blockchainName,
            address: { $regex: new RegExp(`^${address}$`, 'i') } // Case insensitive search
        })
        .lean();
    }

}