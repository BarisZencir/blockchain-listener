import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Service } from '../_common/service';
import { HDWalletService } from 'src/_core/hdwallet/hdwallet.service';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { ConfigService } from '@nestjs/config';
import { UtxoRepository } from './utxo.repository';
import { Utxo, UtxoDocument } from './utxo.model';


@Injectable()
export class UtxoService extends Service<Utxo, UtxoDocument, UtxoRepository> implements OnModuleInit {

    private readonly logger = new Logger(UtxoService.name);
    
    constructor(
        protected repository: UtxoRepository,
        private configService: ConfigService,
    ) {
        super(repository);
    }

    async onModuleInit() : Promise<void> {
       
    }

    async findByAddress(blockchainName : Utxo["blockchainName"], address: Utxo["address"]) : Promise<Utxo[]> {
        return this.repository.findByAddress(blockchainName, address);
    }


}
