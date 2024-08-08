import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { Repository } from '../_common/repository';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { Utxo, UtxoDocument } from './utxo.model';
import { UtxoState } from './enum/utxo.state';

@Injectable()
export class UtxoRepository extends Repository<Utxo, UtxoDocument>{

    constructor(
        @InjectModel(Utxo.name) protected readonly mongoModel: Model<UtxoDocument>) {
        super(mongoModel);
    }

    async safeSave(utxo: Utxo): Promise<Utxo> {
        if(utxo.txid) {
            let isExists = await this.exists({
                txid : utxo.txid
            });
            if(isExists) {
                return;// this.update(utxo);
            }
        }
        return this.save(utxo);
    }

    async findByAddress(blockchainName: Utxo["blockchainName"], address: Utxo["address"]): Promise<Utxo[]> {
        return this.mongoModel.find({ 
            blockchainName: blockchainName,
            address: { $regex: new RegExp(`^${address}$`, 'i') } // Case insensitive search
        })
        .lean({virtuals: true, autopopulate: true});
    }

    async findByAddressAndState(blockchainName: Utxo["blockchainName"], address: Utxo["address"], state : UtxoState): Promise<Utxo[]> {
        return this.mongoModel.find({ 
            blockchainName: blockchainName,
            address: { $regex: new RegExp(`^${address}$`, 'i') }, // Case insensitive search
            state : state
        })
        .lean({virtuals: true, autopopulate: true});
    }

}