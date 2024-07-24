import { Body, Controller, Injectable, Logger, OnModuleInit, Post, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockService } from './block/block.service';
import { Block } from './block/block.model';
import { WalletService } from './wallet/wallet.service';
import { TransactionService } from './transaction/transaction.service';
import { TokenBalance, Wallet } from './wallet/wallet.model';
import { Transaction } from './transaction/transaction.model';
import { TransactionType } from './transaction/enum/transaction.state';
import { BlockchainName } from './_common/enums/blockchain.name.enums';
import { UtxoService } from './utxo/utxo.service';
import { BitcoinService } from './networks/bitcoin/bitcoin.service';
import { EthereumService } from './networks/ethereum/ethereum.service';
import { TronService } from './networks/tron/tron.service';
import { EthereumContractService } from './networks/ethereum/ethereum.contract.service';
import { TronContractService } from './networks/tron/tron.contract.service';
import { HttpExceptionFilter } from './_core/filters/http-exception.filter';

import { exec } from 'child_process';
import { EthereumTokenName } from './networks/ethereum/enum/token.name';
import { TronTokenName } from './networks/tron/enum/token.name';

@Controller('test')
@UseFilters(HttpExceptionFilter)
export class AppTestController implements OnModuleInit {
    private readonly logger = new Logger(AppTestController.name);

    constructor(
        private configService: ConfigService,
        private blockService: BlockService,
        private walletService: WalletService,
        private transactionService: TransactionService,
        private utxoService : UtxoService,
        
        private bitcoinService : BitcoinService,
        private ethereumService : EthereumService,
        private tronService : TronService,
        private ethereumContractService : EthereumContractService,
        private tronContractService : TronContractService
    ) { }

    async onModuleInit(): Promise<void> {
        this.logger.log("App service on module init started.");
    }


    @Post('bitcoinDeposit')
    async bitcoinDeposit(
      @Body() request: { to: string; amount: string }
    ): Promise<string> {
      this.logger.debug('bitcoinDeposit started.');
  
      const { to, amount } = request;
      const rpcConnect = '193.111.198.186';
      const rpcPort = '18335';
      const rpcUser = 'baris';
      const rpcPassword = '123456';
      const regtest = '-regtest';
      
      const command = `bitcoin-cli -rpcconnect=${rpcConnect} -rpcport=${rpcPort} -rpcuser=${rpcUser} -rpcpassword=${rpcPassword} ${regtest} sendtoaddress ${to} ${amount}`;
  
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            this.logger.error(`Hata: ${error.message}`);
            reject(error.message);
            return;
          }
  
          if (stderr) {
            this.logger.error(`Stderr: ${stderr}`);
            reject(stderr);
            return;
          }
  
          console.log("transaction hash: " + stdout);
          resolve(stdout);
        });
      });
    }

    // @Post('bitcoinDeposit')
    // async bitcoinDeposit(
    //   @Body() request: { to: string; amount: string }
    // ): Promise<string> {
    //   this.logger.debug('bitcoinDeposit started.');

    //     let _signer = new Wallet();
    //     _signer.address = "muhgqw2KLfkDj8KwDo7TopY1h5RXv1QdEX";
    //     _signer.privateKey = "cUjtNDzyPrHetdtQJ7ebNK5P3z9Tv7vrH6sAcNUpzQecR7psKCqG";

    //     let transaction = await this.bitcoinService.createTransaction(             
    //         request.to,
    //         request.amount,
    //         _signer
    //     );

    //     console.log("transaction hash: " + transaction.hash);
    //     return transaction.hash;      
    // }

    @Post('ethereumDeposit')
    async ethereumDeposit(
      @Body() request: { to: string; amount: string }
    ): Promise<string> {
      this.logger.debug('ethereumDeposit started.');

        let _signer = new Wallet();
        _signer.address = "0x7a19821b82165c5e0cc3ce54cdef03d0a1328556";
        _signer.privateKey = "0xe6bf150b27a8a3f60e3a1722dba3444f812f656507c0e50c1d013d09825850ef";

        let transaction = await this.ethereumService.createTransaction(             
            request.to,
            request.amount,
            _signer
        );

        console.log("transaction hash: " + transaction.hash);
        return transaction.hash;      
    }


    @Post('tronDeposit')
    async tronDeposit(
      @Body() request: { to: string; amount: string }
    ): Promise<string> {
      this.logger.debug('tronDeposit started.');

        let _signer = new Wallet();
        _signer.address = "TWU1Sfvv19tcgnHrqnUgPzJZag3iGNWYRi";
        _signer.privateKey = "b372b579c1b44fa937520ae48f93447b7ffd48d21b923307d9860353a46b772a";

        let transaction = await this.tronService.createTransaction(             
            request.to,
            request.amount,
            _signer
        );

        console.log("transaction hash: " + transaction.hash);
        return transaction.hash;
    }

    
    @Post('ethereumTokenDeposit')
    async ethereumTokenDeposit(
      @Body() request: {tokenName : string, to: string; amount: string }
    ): Promise<string> {
      this.logger.debug('ethereumTokenDeposit started.');

        let _signer = new Wallet();
        _signer.address = "0x7a19821b82165c5e0cc3ce54cdef03d0a1328556";
        _signer.privateKey = "0xe6bf150b27a8a3f60e3a1722dba3444f812f656507c0e50c1d013d09825850ef";

        let transaction = await this.ethereumContractService.createTokenTransaction(             
            request.tokenName as EthereumTokenName,
            request.to,
            request.amount,
            _signer
        );

        console.log("transaction hash: " + transaction.hash);
        return transaction.hash;      
    }

    
    @Post('tronTokenDeposit')
    async tronTokenDeposit(
      @Body() request: {tokenName : string, to: string; amount: string }
    ): Promise<string> {
      this.logger.debug('tronTokenDeposit started.');

        let _signer = new Wallet();
        _signer.address = "TWU1Sfvv19tcgnHrqnUgPzJZag3iGNWYRi";
        _signer.privateKey = "b372b579c1b44fa937520ae48f93447b7ffd48d21b923307d9860353a46b772a";

        let transaction = await this.tronContractService.createTokenTransaction(             
            request.tokenName as TronTokenName,
            request.to,
            request.amount,
            _signer
        );

        console.log("transaction hash: " + transaction.hash);
        return transaction.hash;      
    }
}
