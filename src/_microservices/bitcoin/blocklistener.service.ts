import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';
import { Block } from 'src/block/block.model';
import { BlockService } from 'src/block/block.service';
import { BitcoinService } from 'src/networks/bitcoin/bitcoin.service';
import { TransactionState, TransactionType } from 'src/transaction/enum/transaction.state';
import { Transaction } from 'src/transaction/transaction.model';
import { TransactionService } from 'src/transaction/transaction.service';
import { UtxoState } from 'src/utxo/enum/utxo.state';
import { Utxo } from 'src/utxo/utxo.model';
import { UtxoService } from 'src/utxo/utxo.service';
import { Wallet } from 'src/wallet/wallet.model';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class BlockListenerService extends BitcoinService implements OnModuleInit {

    logger = new Logger(BlockListenerService.name);

    constructor(
        protected configService: ConfigService,        
        protected readonly blockService: BlockService,
        protected readonly walletService: WalletService,
        protected readonly utxoService : UtxoService,
        protected readonly transactionService: TransactionService

    ) {
        super(configService, walletService, utxoService, transactionService);
    }

    async onModuleInit(): Promise<void> {
        await super.initService();

        // let txId = await this.createTransaction(
		// 	"bcrt1qefcv4stdjgfsg0s425a5k9wnmc8cg9mm0nxm4h",
		// 	"bcrt1qmvqqv6mjk6ufm45dnxuutsrzx20k7mrgwuslwt",
		// 	24,
		// 	"cUMhFwYefQedP2zXBN3yME7jJcoQayii5H1wmHVF3t2WL9AyogVS"
		// );
    }

    
    async getLatestProccessedBlockNumber() : Promise<BigNumber> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.BITCOIN,
            groupIndex : -1
        })

        if(!block) {
            return null;
        }

        return new BigNumber(block.blockNumber);
    }

    async initFirstBlock(blockNumber: BigNumber) : Promise<void> {
        let block = new Block();
        block.blockNumber = blockNumber.toString();
        block.blockchainName = BlockchainName.BITCOIN;
        await this.blockService.save(block);
    }

    async updateBlock(blockNumber: BigNumber) : Promise<void> {
        let block = await this.blockService.findOne({
            blockchainName : BlockchainName.BITCOIN,
            groupIndex : -1
        })
        block.blockNumber = blockNumber.toString();
        await this.blockService.update(block);
    }

    async proccessBlock(blockNumber: BigNumber, latestBlockNumber : BigNumber): Promise<boolean> {

        this.logger.debug('Bitcoin block processed. blockNumber: ' + blockNumber);
        
        try {
            
            let hasTransaction = false;
            const blockJSON = await this.getBlock(blockNumber);
            if (!blockJSON) {
                throw new Error(`Err1. in Bitcoin processBlock. blockNumber: ${blockNumber}`);
            }

            const transactionHashList = blockJSON.tx || [];

            if(transactionHashList.length > 1) {
                 console.log("block has tx");
            }

            for (let i = 0; i < transactionHashList.length; i++) {
                try {

                    const txJSON = await this.getRawTransaction(transactionHashList[i]);
                    let minerTransaction = txJSON.vin.some(vin => vin.coinbase);
                    if(minerTransaction) {
                        continue;
                    }

                    let txid = txJSON.txid;

                    let vinTxIds = [];
                    let vinAddresses = [];
                    let vinValues = [];
                    let vinTotalValue = new BigNumber(0);

                    let voutAddresses = [];
                    let voutValues = [];
                    let voutScriptPubKeys = [];
                    let voutTotalValue = new BigNumber(0);

                    let fee : BigNumber;

                    for (let n = 0; n < txJSON.vin.length; n++) {
                        let vin = txJSON.vin[n];
                        let vinTxRaw = await this.getRawTransaction(vin.txid);
                        let vinAddress = vinTxRaw.vout[vin.vout].scriptPubKey.addresses[0].toLowerCase();
                        let vinValue = this.convertBitcoinToSatoshi(vinTxRaw.vout[vin.vout].value);
                        
                        vinTxIds.push(vin.txid);
                        vinAddresses.push(vinAddress);
                        vinValues.push(vinValue);
                        vinTotalValue = vinTotalValue.plus(vinValue);
                    }

                    for (let n = 0; n < txJSON.vout.length; n++) {
                        let vout = txJSON.vout[n];
                        let voutAddress = vout.scriptPubKey.addresses[0].toLowerCase();
                        let voutValue = this.convertBitcoinToSatoshi(vout.value);

                        voutAddresses.push(voutAddress);
                        voutValues.push(voutValue);
                        voutTotalValue = voutTotalValue.plus(voutValue);
                        voutScriptPubKeys.push(vout.scriptPubKey.hex)
                    }

                    //calculate fee
                    fee = vinTotalValue.minus(voutTotalValue);

                    let isExistsVinWallet = await this.walletService.exists({
                        blockchainName : BlockchainName.BITCOIN,
                        address : {$in : vinAddresses}
                    });

                    let isExistsVoutWallet = await this.walletService.exists({
                        blockchainName : BlockchainName.BITCOIN,
                        address : {$in : voutAddresses}
                    });

                    if(!isExistsVinWallet && !isExistsVoutWallet) {
                        //bizle alakasi yok
                        continue;
                    }

                    if(!isExistsVinWallet && isExistsVoutWallet) {
                        //deposit
                        //to wallet bul. not: birden fazla adresimize gonderilmesi ihmal edildi.
                        //ilk tespit edilin bizim adresimize gore islem yapilir.
                        let toWallet = await this.walletService.findOne({
                            blockchainName : BlockchainName.BITCOIN,
                            address : {$in : voutAddresses}   
                        });

                        let utxo = new Utxo();
                        utxo.txid = txid;
                        utxo.vout = voutAddresses.indexOf(toWallet.address);
                        utxo.scriptPubKey = voutScriptPubKeys[utxo.vout];
                        utxo.address = toWallet.address;
                        utxo.blockchainName = toWallet.blockchainName;
                        utxo.amount = (new BigNumber(voutValues[utxo.vout])).toString();
                        utxo.state = UtxoState.UN_SPENT;                            
                        await this.utxoService.save(utxo);
                        hasTransaction = true;
                    
                        let transaction = new Transaction();
 
                        transaction.blockchainName = utxo.blockchainName;
                        transaction.state = TransactionState.COMPLATED;
                        transaction.type = TransactionType.DEPOSIT;
                        transaction.txid = txid;

                        //simdilik kalsin. deposit'de from bizim icin onemli mi?
                        //transaction.from = ?;

                        transaction.to = toWallet.address;
                        transaction.amount = utxo.amount;
                        transaction.fee = fee.toString();
                        transaction.processedBlockNumber = blockNumber.toString();
                        transaction.complatedBlockNumber = latestBlockNumber.toString();

                        await this.transactionService.save(transaction);

                    }

                    if(isExistsVinWallet) {

                        //todo: vin'deki utxo'lari vinTxIds'e gore spent'e cek.
                        for(let j = 0; j < vinAddresses.length; j++ ) {
                            //not: mantiken bir transactionun vout'unda aynı adresten iki cikti olmamasi lazim.
                            //bende utxo'lari ona gore olusturduguma gore asagidaki sorgu dogru olmali.
                            let utxo = await this.utxoService.findOne({
                                blockchainName : BlockchainName.BITCOIN,
                                txid : vinTxIds[j],
                                address : vinAddresses[j],
                            });

                            if(utxo) {
                                utxo.state = UtxoState.SPENT;
                                utxo.usedTxid = txid;
                                await this.utxoService.update(utxo);
                            }
                            
                        }

                        for(let j = 0; j < voutAddresses.length; j++) {
                            let toWallet = await this.walletService.findOne({
                                blockchainName : BlockchainName.BITCOIN,
                                address : voutAddresses[j]   
                            });
    
                            if(toWallet) {
                                let utxo = new Utxo();
                                utxo.txid = txid;
                                utxo.vout = voutAddresses.indexOf(toWallet.address);
                                utxo.address = toWallet.address;
                                utxo.scriptPubKey = voutScriptPubKeys[utxo.vout];
                                utxo.blockchainName = toWallet.blockchainName;
                                utxo.amount = (new BigNumber(voutValues[utxo.vout])).toString();
                                utxo.state = UtxoState.UN_SPENT;                            
                                await this.utxoService.save(utxo);    
                            }
                        }

                        //withdraw veya virman
                        //islemleri biz yaptik. her zaman tek bir addrese para gonderiyoz.
                        //ve bu gonderilen address vin'de hic bir zaman olmayacak. (ya 0 address'e 1..n'den yada 0'dan cold wallet'a gonderecez.)
                        const toAddress = voutAddresses.filter(address => !vinAddresses.includes(address))[0];
                        if(toAddress) {
                            let toWallet = await this.walletService.findOne({
                                blockchainName : BlockchainName.BITCOIN,
                                address : toAddress   
                            });
    
                            let voutIndex = voutAddresses.indexOf(toAddress);


                            // WITHDRAW + VIRMAN
                            const transaction = await this.transactionService.findByTxid(BlockchainName.BITCOIN, txid);
                            if (!transaction) {
                                // TODO: Handle case if txDoc is null
                            } else {
    
                                transaction.state = TransactionState.COMPLATED;
                                transaction.amount = voutValues[voutIndex].toString();
                                transaction.type = (toWallet == null) ? TransactionType.WITHDRAW : TransactionType.VIRMAN;
                                transaction.fee = fee.toString();
                                transaction.processedBlockNumber = blockNumber.toString();
                                transaction.complatedBlockNumber = latestBlockNumber.toString();        
                                await this.transactionService.update(transaction);
        
                                hasTransaction = true;
                            }

                        } else {
                            //nsa'da buraya girmez.

                        }

                    }
                    
                } catch (error) {
                    //TODO: blockta hata alindi bunu db'ye yazalim.
                    throw error;
                }
            }

            await this.updateBlock(blockNumber);
            return hasTransaction;
        } catch (error) {
            throw error;
        }
    }

}
