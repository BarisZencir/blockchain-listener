'use strict';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { WalletService } from 'src/wallet/wallet.service';

import _ from 'lodash';
import BigNumber from 'bignumber.js';
import TronWeb from 'tronweb';
import { sleep } from 'src/_common/utils/sandbox.utils';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';

import trc20Abi from './jsons/trc20.abi.json'; // Assuming TRC20 ABI is stored here
import { TronTokenName } from './enum/token.name';
import { Wallet } from 'src/wallet/wallet.model';
import { TronService } from './tron.service';
import { ITransferEvent } from '../ethereum/ethereum.contract.service';


@Injectable()
export class TronContractService extends TronService implements OnModuleInit {
    logger = new Logger(TronContractService.name);
    
    protected tronWeb: TronWeb | null;
    protected availableTokenNames: Array<TronTokenName>;
    protected tokenContracts: Map<TronTokenName, TronWeb.Contract>;
    public tokenGroupIndex : number;
    private tokenGroupsForInit : Map<string, string> = new Map<string, string>;

    constructor(
        protected readonly configService: ConfigService,
        protected readonly walletService: WalletService,
    ) {
        super(configService, walletService);
    }

    async onModuleInit(): Promise<void> {
		await super.initService();
        // console.log(erc20Abi)

        // let blockNumber = await this.getBlockNumber();
        // console.log("blockNumber: " + blockNumber);

        // let block = await this.getBlock(blockNumber);
        // console.log("block: " + block);

        // let balance = await this.getBalance("TWU1Sfvv19tcgnHrqnUgPzJZag3iGNWYRi");
        // console.log("balance: " + balance);

        // balance = await this.getBalance("TE7at8C1i4C4cYThxVzGWtzixtE7u4JZXy");
        // console.log("balance(acc 2): " + balance);


        // let tx = await this.sendRawTransaction(
        //     "TWU1Sfvv19tcgnHrqnUgPzJZag3iGNWYRi", 
        //     "TE7at8C1i4C4cYThxVzGWtzixtE7u4JZXy",
        //     "200",
        //     "b372b579c1b44fa937520ae48f93447b7ffd48d21b923307d9860353a46b772a"
        // );

        // console.log("tx transactionHash: " + tx.txid);

        // tx = await this.getTransaction(tx.txid);
        // console.log("tx: " + tx);

        // await sleep(1000 * 60);

        // balance = await this.getBalance("TE7at8C1i4C4cYThxVzGWtzixtE7u4JZXy");
        // console.log("balance(acc 2): " + balance);

        



        // let balance = await this.getContractBalanceOf(TronTokenName.USDT, "TWU1Sfvv19tcgnHrqnUgPzJZag3iGNWYRi");
        // console.log("balance: " + balance);

        // let tx = await this.transfer(
        //     TronTokenName.USDT, 
        //     "TE7at8C1i4C4cYThxVzGWtzixtE7u4JZXy",
        //     "12",
        //     {
        //         address : "TWU1Sfvv19tcgnHrqnUgPzJZag3iGNWYRi",
        //         privateKey : "b372b579c1b44fa937520ae48f93447b7ffd48d21b923307d9860353a46b772a"
        //     }
        // );

        // console.log("tx: " + tx.txID);

        // tx = await this.getTransaction(tx.txID);
        // console.log("tx: " + tx);

        // await sleep(1000 * 30);

        // let txInfo = await this.getTransactionInfo(tx.txID);
        // console.log("txInfo: " + txInfo);

        // await sleep(1000 * 30);

        // txInfo = await this.getTransactionInfo(tx.txID);
        // console.log("txInfo: " + txInfo);

        // balance = await this.getContractBalanceOf(TronTokenName.USDT, "TE7at8C1i4C4cYThxVzGWtzixtE7u4JZXy");
        // console.log("balance(acc 2): " + balance);

        // let events = await this.getContractTransferEvents(TronTokenName.USDT, txInfo.blockNumber);
        // console.log(events);


        // let events = await this.getContractTransferEvents(TronTokenName.USDT, 48700879);
        // console.log(events);
        
    }


    async initService(): Promise<void> {		
		await super.initService();
        this.tokenGroupIndex = parseInt(this.configService.get<string>("NETWORK_TRON_TOKEN_GROUP_INDEX"));
        this.tokenGroupsForInit = new Map<string, string>();
        if('undefined'!= typeof this.tokenGroupIndex) {
            let tokenGroups = this.configService.get<Array<Map<string, string>>>("network.tron.tokenGroups")
            if(this.tokenGroupIndex == -1) {
                //main.
                this.tokenGroupsForInit = tokenGroups.reduce((acc, map) => new Map([...acc, ...Array.from(map.entries())]), new Map());
            } else if(this.tokenGroupIndex >= 0 && this.tokenGroupIndex < tokenGroups.length) {
                this.tokenGroupsForInit = tokenGroups[this.tokenGroupIndex];
            }
        } 
        this.initTokenContracts(this.tokenGroupsForInit);
	}

    protected async checkAndTryConnection(): Promise<void> {
        if (!this.isConnected()) {
            await this.connect();
            this.initTokenContracts(this.tokenGroupsForInit);
        }
    }

    initTokenContracts(tokenMap : Map<TronTokenName | string, string>) {
        const tronTokenNames = Object.values(TronTokenName);
        this.availableTokenNames = new Array<TronTokenName>();
        this.tokenContracts = new Map<TronTokenName, TronWeb.Contract>();
        tokenMap.forEach((value, key) => {
            if (tronTokenNames.includes(key as TronTokenName)) {
                this.logger.debug(`${key} is a valid TronTokenName with value: ${value}`);
                this.availableTokenNames.push(key as TronTokenName);
                const contract = this.tronWeb.contract(trc20Abi, value);
                this.tokenContracts.set(key as TronTokenName, contract);
            } else {
                this.logger.debug(`${key} is not a valid TronTokenName`);
                // Key is not a valid TronTokenName, handle this case
            }
        });
    }

    async getContractName(tokenName: TronTokenName): Promise<string> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        return await contract.methods.name().call();
    }

    async getContractSymbol(tokenName: TronTokenName): Promise<string> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        return await contract.methods.symbol().call();
    }

    async getContractDecimals(tokenName: TronTokenName): Promise<number> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        return await contract.methods.decimals().call();
    }

    async getContractTotalSupply(tokenName: TronTokenName): Promise<string> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        return await contract.methods.totalSupply().call();
    }

    async getContractBalanceOf(tokenName: TronTokenName, address: string): Promise<string> {
        await this.checkAndTryConnection();
        try {
            let contract = this.tokenContracts.get(tokenName);
            return await contract.methods.balanceOf(address).call();
        } catch(error) {
            console.log(error);
        }
    }

    async createTokenTransaction(tokenName: TronTokenName, to: string, amount: string, _signer: Pick<Wallet, 'address' | 'privateKey'>): Promise<any> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);

        const tx = await contract.methods.transfer(to, amount).send({}, _signer.privateKey);

        const receipt = await this.getTransactionInfo(tx);

        let transaction = new Transaction();
        transaction.blockchainName = BlockchainName.TRON;
        transaction.tokenName = tokenName;
        transaction.hash = tx;
        transaction.state = TransactionState.REQUESTED;
        transaction.estimatedAmount = amount;
        transaction.estimatedFee = receipt?.fee;
        let toWallet = await this.walletService.findOne({
            blockchainName: BlockchainName.TRON,
            address: to
        });

        transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
        transaction.from = _signer.address;
        transaction.to = to;
        transaction.requestedBlockNumber = (await this.getBlockNumber()).toString();

        return receipt.txID ? receipt : {txID : tx};
    }

    async convertHexToTronAddress(hexAddress: string): Promise<string> {
        try {
            const tronAddress = this.tronWeb.address.fromHex(hexAddress);
            return tronAddress;
        } catch (error) {
            console.error('Error converting address:', error);
            throw error;
        }
    }

    async getContractTransferEvents(tokenName: TronTokenName, blockNumber: number): Promise<ITransferEvent[]> {
        await this.checkAndTryConnection();
        const contract = this.tokenContracts.get(tokenName);
    
        try {
            // Kontrattan etkinlikleri almak için getEventResult yerine uygun fonksiyonu kullanın
            const events = await this.tronWeb.getEventResult(contract.address, {
                eventName: 'Transfer',
                block_number: {
                    $gte: blockNumber,
                    $lte: blockNumber
                }
            });
    
            return Promise.all(events.map(async event => ({
                transactionHash: event.transaction,
                tokenName: tokenName,
                from: await this.convertHexToTronAddress(event.result['src']),
                to: await this.convertHexToTronAddress(event.result['dst']),
                value: event.result['wad']
            })));

        } catch (error) {
            console.error('Error getting transfer events:', error);
            throw error;
        }
    }
}
