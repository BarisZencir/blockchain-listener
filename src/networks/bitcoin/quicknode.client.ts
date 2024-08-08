import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';
import {ECPairFactory} from 'ecpair';
import * as ecc from 'tiny-secp256k1';

export interface Input {
    txid: string;
    vout: number;
}

export interface Output {
    [address: string]: number;
}


export class QuickNodeClient {
    private readonly endpoint: string;
    private readonly network: string;

    constructor(apiUrl: string, network : string) {
        this.endpoint = apiUrl;
        this.network = network || "bitcoin";
        
    }

    private async postRequest(method: string, params: any[] = []): Promise<any> {
        try {
            const response = await axios.post(
                this.endpoint,
                { method, params },
                { headers: { 'Content-Type': 'application/json' } }
            );
            return response.data.result;
        } catch (error) {
            console.error(`Error executing method ${method}:`, error);
            throw error;
        }
    }

    async getBlockCount(): Promise<number> {
        return this.postRequest('getblockcount');
    }

    async getBlockHash(blockNumber: number): Promise<string> {
        return this.postRequest('getblockhash', [blockNumber]);
    }

    async getBlock(blockHash: string): Promise<any> {
        return this.postRequest('getblock', [blockHash]);
    }

    async getRawTransaction(txid: string, verbose: number = 0): Promise<any> {
        return this.postRequest('getrawtransaction', [txid, verbose]);
    }

    async createAndSignRawTransaction(inputs: Input[], outputs: Output, wif : string): Promise<string> {
        // Ağ seçimi (testnet veya bitcoin)
        const bitcoinNetwork = bitcoin.networks[this.network]; // veya bitcoin.networks.bitcoin
        const ECPair = ECPairFactory(ecc);

        // Anahtar çiftini oluşturun veya yükleyin        
        const keyPair = ECPair.fromWIF(wif, bitcoinNetwork);

        // Psbt oluşturma
        const psbt = new bitcoin.Psbt({ network: bitcoinNetwork });

        // İşlem girdi ekleme
        for(let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            let rawTx = await this.getRawTransaction(input.txid, 0);

            psbt.addInput({
                hash: input.txid,
                index: i,
                nonWitnessUtxo: Buffer.from(rawTx, 'hex'),
            });
        }

        // İşlem çıktı ekleme
        for (const [address, amount] of Object.entries(outputs)) {
            psbt.addOutput({
              address,
              value: Math.round(amount * 1e8) // Bitcoin miktarını Satoshi'ye çevirin
            });
        }

        // İmza ekleme
        psbt.signAllInputs(keyPair);

        // İşlemi finalize etme
        psbt.finalizeAllInputs();

        // Raw transaction'ı alma
        const rawTx = psbt.extractTransaction().toHex();

        console.log(rawTx);
        return rawTx;
    }


    async createRawTransaction(inputs: Input[], outputs: Output): Promise<string> {
        const bitcoinNetwork = bitcoin.networks[this.network]; // veya bitcoin.networks.bitcoin
        const psbt = new bitcoin.Psbt({ network: bitcoinNetwork });

        for (const input of inputs) {
            const rawTx = await this.getRawTransaction(input.txid, 0);
            psbt.addInput({
                hash: input.txid,
                index: input.vout,
                nonWitnessUtxo: Buffer.from(rawTx, 'hex'),
            });
        }

        for (const [address, amount] of Object.entries(outputs)) {
            psbt.addOutput({
                address,
                value: Math.round(amount * 1e8), // Bitcoin amount in Satoshi
            });
        }

        const rawTx = psbt.toBase64(); // PSBT'yi Base64 formatında döndür
        return rawTx;
    }

    async signRawTransactionWithKey(psbtBase64: string, privKeys: string[]): Promise<any> {
        const bitcoinNetwork = this.network === 'bitcoin' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network: bitcoinNetwork });

        const ECPair = ECPairFactory(ecc);    
        for (const wif of privKeys) {
            const keyPair = ECPair.fromWIF(wif, bitcoinNetwork);
            psbt.signAllInputs(keyPair);
        }

        psbt.finalizeAllInputs();
        const signedTx = psbt.extractTransaction().toHex();

        return { hex: signedTx };
    }

    async sendRawTransaction(signedTxHex: string): Promise<string> {
        return this.postRequest('sendrawtransaction', [signedTxHex]);
    }
}
