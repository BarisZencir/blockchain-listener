import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';


@Injectable()
export class BitcoinService implements OnModuleInit {
	private readonly logger = new Logger(BitcoinService.name);

	constructor(
		private configService: ConfigService,
	) { }


	async onModuleInit(): Promise<void> {
		
	}

}
