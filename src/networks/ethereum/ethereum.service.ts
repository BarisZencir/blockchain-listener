import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';


@Injectable()
export class EthereumService implements OnModuleInit {
	private readonly logger = new Logger(EthereumService.name);

	constructor(
		private configService: ConfigService,
	) { }


	async onModuleInit(): Promise<void> {
		
	}

}
