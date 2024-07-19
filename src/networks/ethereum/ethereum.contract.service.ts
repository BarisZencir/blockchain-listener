'use strict';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { WalletService } from 'src/wallet/wallet.service';

import _ from 'lodash';
import BigNumber from "bignumber.js";
import * as ethUtil from 'ethereumjs-util';
import Web3, { Contract, ContractAbi, EventLog } from 'web3';
import Common from 'ethereumjs-common';
import { EthereumService } from './ethereum.service';
import { BlockService } from 'src/block/block.service';
import { TransactionService } from 'src/transaction/transaction.service';

import erc20Abi from './jsons/erc20.abi.json';
import { EthereumTokenName } from './enum/token.name';
import { Wallet } from 'src/wallet/wallet.model';
import { sleep } from 'src/_common/utils/sandbox.utils';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';


export interface ITransferEvent {
    transactionHash : string,
    tokenName : EthereumTokenName;
    from: string;
    to: string;
    value: string;
}

@Injectable()
export class EthereumContractService extends EthereumService implements OnModuleInit {
 
    logger = new Logger(EthereumContractService.name);
	protected availableTokenNames : Array<EthereumTokenName>;
    protected tokenContracts : Map<EthereumTokenName, Contract<any>>;
    public tokenGroupIndex : number;
    private tokenGroupsForInit : Map<string, string> = new Map<string, string>;

	constructor(
        protected configService: ConfigService,
        protected readonly walletService: WalletService,
        protected transactionService : TransactionService

    ) { 
        super(configService, walletService, transactionService);
    }

	async onModuleInit(): Promise<void> {
		super.onModuleInit();
        // console.log(erc20Abi)

        this.tokenGroupIndex = parseInt(this.configService.get<string>("NETWORK_ETHEREUM_TOKEN_GROUP_INDEX"));
        this.tokenGroupsForInit = new Map<string, string>();
        if('undefined'!= typeof this.tokenGroupIndex) {
            let tokenGroups = this.configService.get<Array<Map<string, string>>>("network.ethereum.tokenGroups")
            if(this.tokenGroupIndex == -1) {
                //main.
                this.tokenGroupsForInit = tokenGroups.reduce((acc, map) => new Map([...acc, ...Array.from(map.entries())]), new Map());
            } else if(this.tokenGroupIndex >= 0 && this.tokenGroupIndex < tokenGroups.length) {
                this.tokenGroupsForInit = tokenGroups[this.tokenGroupIndex];
            }
        } 
        this.initTokenContracts(this.tokenGroupsForInit);

        // let blockNumber = await this.getBlockNumber();
        // console.log("blockNumber: " + blockNumber);

        // let block = await this.getBlock(blockNumber);
        // console.log("block: " + block);

        // let balance = await this.getBalance("0x7a19821b82165c5e0cc3ce54cdef03d0a1328556");
        // console.log("balance: " + balance);

        // let tx = await this.sendRawTransaction(
        //     "0x7a19821b82165c5e0cc3ce54cdef03d0a1328556", 
        //     "0xb9d1EC049d114fc42AAb60A36D49282ee1D69679",
        //     "123",
        //     "0xe6bf150b27a8a3f60e3a1722dba3444f812f656507c0e50c1d013d09825850ef"
        // );

        // console.log("tx transactionHash: " + tx.transactionHash);

        // tx = await this.getTransaction(tx.transactionHash);
        // console.log("tx: " + tx);

        // await sleep(1000 * 60);

        // balance = await this.getBalance("0xb9d1EC049d114fc42AAb60A36D49282ee1D69679");
        // console.log("balance(acc 2): " + balance);


        // let balance = await this.getContractBalanceOf(EthereumTokenName.RNDR, "0xb9d1EC049d114fc42AAb60A36D49282ee1D69679");
        // console.log("balance: " + balance);

        // let tx = await this.transfer(
        //     EthereumTokenName.RNDR, 
        //     "0xb9d1EC049d114fc42AAb60A36D49282ee1D69679",
        //     "123",
        //     {
        //         address : "0x7a19821b82165c5e0cc3ce54cdef03d0a1328556",
        //         privateKey : "0xe6bf150b27a8a3f60e3a1722dba3444f812f656507c0e50c1d013d09825850ef",
        //         nonce : 5
        //     }
        // );

        // console.log("tx transactionHash: " + tx.transactionHash);

        // tx = await this.getTransaction(tx.transactionHash);
        // console.log("tx: " + tx);

        // await sleep(1000 * 30);

        // tx = await this.getTransaction(tx.hash);
        // console.log("tx: " + tx);

        // balance = await this.getContractBalanceOf(EthereumTokenName.RNDR, "0xb9d1EC049d114fc42AAb60A36D49282ee1D69679");
        // console.log("balance(acc 2): " + balance);

        // let events = await this.getContractTransferEvents(EthereumTokenName.RNDR, tx.blockNumber);
        // console.log(events);


        // let events = await this.getContractTransferEvents(EthereumTokenName.RNDR, 14025);
        // console.log(events);

	}

    override async checkAndTryConnection(): Promise<void> {
        if (!this.isConnected()) {
            await this.connect();
            this.initTokenContracts(this.tokenGroupsForInit);
        }
    }

    initTokenContracts(tokenMap : Map<EthereumTokenName | string, string>) {
        const ethereumTokenNames = Object.values(EthereumTokenName);
        this.availableTokenNames = new Array<EthereumTokenName>();
        this.tokenContracts = new Map<EthereumTokenName, Contract<any>>();
        tokenMap.forEach((value, key) => {
            if (ethereumTokenNames.includes(key as EthereumTokenName)) {
                this.logger.debug(`${key} is a valid EthereumTokenName with value: ${value}`);
                this.availableTokenNames.push(key as EthereumTokenName);
                this.tokenContracts.set(key as EthereumTokenName, new this.web3.eth.Contract(erc20Abi as any, value));
            } else {
                this.logger.debug(`${key} is not a valid EthereumTokenName`);
                // Key is not a valid EthereumTokenName, handle this case
            }
        });
    }

    async getContractName(tokenName: EthereumTokenName): Promise<string> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        const name = await contract.methods.name().call();
        if (typeof name === 'string') {
            return name;
        } else {
            throw new Error('Unexpected type for token name');
        }
    }


    async getContractSymbol(tokenName: EthereumTokenName): Promise<string> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        const symbol = await contract.methods.symbol().call();
        if (typeof symbol === 'string') {
            return symbol;
        } else {
            throw new Error('Unexpected type for token symbol');
        }
    }

    async getContractDecimals(tokenName: EthereumTokenName): Promise<number> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        const decimals = await contract.methods.decimals().call();
        if (typeof decimals === 'number') {
            return decimals;
        } else {
            throw new Error('Unexpected type for token decimals');
        }
    }

    async getContractTotalSupply(tokenName: EthereumTokenName): Promise<string> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        const totalSupplyResult = await contract.methods.totalSupply().call();
        if (typeof totalSupplyResult === 'string') {
            return totalSupplyResult;
        } else {
            throw new Error('Unexpected type for total supply');
        }
    }

    async getContractBalanceOf(tokenName: EthereumTokenName, address: string): Promise<string> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        const balanceResult = await contract.methods.balanceOf(address).call();
        if (typeof balanceResult === 'bigint') {
            return (new BigNumber(balanceResult)).toString();
        } else {
            throw new Error('Unexpected type for balance');
        }
    }

    // async getContractAllowance(tokenName: EthereumTokenName, owner: string, spender: string): Promise<string> {
    //     await this.checkAndTryConnection();
    //     let contract = this.tokenContracts.get(tokenName);
    //     const allowanceResult = await contract.methods.allowance(owner, spender).call();
    //     if (typeof allowanceResult === 'string') {
    //         return allowanceResult;
    //     } else {
    //         throw new Error('Unexpected type for allowance');
    //     }
    // }

    async transfer(tokenName: EthereumTokenName, to: string, amount: string, _signer : Pick<Wallet, 'address' | 'privateKey' | 'nonce'>): Promise<any> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        const txCount = await this.web3!.eth.getTransactionCount(_signer.address); //note: simdilik boyle de bunu wallettan yonetecez.

		let value = this.web3.utils.numberToHex(this.web3!.utils.toWei(amount, 'ether'));

        const data = contract.methods.transfer(to, value).encodeABI();

        const tx = {
            nonce: this.web3!.utils.numberToHex(txCount),
            to: contract.options.address,
            data,
            gasLimit: this.web3!.utils.numberToHex(100000),
            gasPrice: this.web3!.utils.numberToHex(this.web3!.utils.toWei('10', 'gwei')),
            chainId: this.settings.chainId

        };
        
        const signedTx = await this.web3.eth.accounts.signTransaction(tx, _signer.privateKey);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        let transaction = new Transaction();
        transaction.blockchainName = BlockchainName.ETHEREUM;
        transaction.tokenName = tokenName;
        transaction.hash = receipt.transactionHash.toString();
        transaction.state = TransactionState.REQUESTED;
        transaction.estimatedAmount = value;

        let toWallet = await this.walletService.findOne({
            blockchainName : BlockchainName.ETHEREUM,
            address : to   
        });

        transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
        transaction.from = _signer.address;
        transaction.to = to;
        transaction.estimatedFee = (new BigNumber(tx.gasPrice)).times(tx.gasLimit).toString();
        transaction.requestedBlockNumber = (await this.getBlockNumber())?.toString();
        await this.transactionService.save(transaction);

        return receipt;
    }

    async getContractTransferEvents(tokenName: EthereumTokenName, blockNumber: number): Promise<ITransferEvent[]> {
        await this.checkAndTryConnection();
        let contract = this.tokenContracts.get(tokenName);
        let events = new Array<ITransferEvent>();

        const pastEvents : (string | EventLog)[] = await contract.getPastEvents('Transfer', {
            fromBlock: blockNumber,
            toBlock: blockNumber
        });
    
        if (pastEvents.length) {
            pastEvents.forEach(event => {
                if('object' === typeof event) {
                    events.push({
                        transactionHash : event.transactionHash as string,
                        tokenName: tokenName, 
                        from : event.returnValues.from as string, 
                        to: event.returnValues.to as string, 
                        value: (new BigNumber(event.returnValues.value as string)).toString()
                    })
                }
            });
        }

        return events;
    }

    //note: bunlari kapattim kullanmayiz diye dusunuyorum. gerekirse acariz.
    // async transferFrom(tokenName: EthereumTokenName, from: string, to: string, amount: string, _signer : Wallet): Promise<any> {
    //     await this.checkAndTryConnection();
    //     let contract = this.tokenContracts.get(tokenName);
    //     const data = contract.methods.transferFrom(from, to, amount).encodeABI();
    //     const txCount = await this.web3!.eth.getTransactionCount(_signer.address);

    //     const tx = {
    //         nonce: this.web3!.utils.numberToHex(txCount),
    //         to: contract.options.address,
    //         data,
    //         gasLimit: this.web3!.utils.numberToHex(100000),
    //         gasPrice: this.web3!.utils.numberToHex(this.web3!.utils.toWei('10', 'gwei')),
    //         chainId: this.settings.chainId

    //     };
        
    //     const signedTx = await this.web3.eth.accounts.signTransaction(tx, _signer.privateKey);
    //     const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);        
    //     return receipt;

    // }

    // async approve(tokenName: EthereumTokenName, spender: string, amount: string, _signer : Wallet): Promise<any> {
    //     await this.checkAndTryConnection();
    //     let contract = this.tokenContracts.get(tokenName);
    //     const data = contract.methods.approve(spender, amount).encodeABI();
    //     const txCount = await this.web3!.eth.getTransactionCount(_signer.address);

    //     const tx = {
    //         nonce: this.web3!.utils.numberToHex(txCount),
    //         to: contract.options.address,
    //         data,
    //         gasLimit: this.web3!.utils.numberToHex(100000),
    //         gasPrice: this.web3!.utils.numberToHex(this.web3!.utils.toWei('10', 'gwei')),
    //         chainId: this.settings.chainId

    //     };
        
    //     const signedTx = await this.web3.eth.accounts.signTransaction(tx, _signer.privateKey);
    //     const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);        
    //     return receipt;

    // }
}
