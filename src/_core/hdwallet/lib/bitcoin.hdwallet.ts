import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as bip39 from 'bip39';
import { IAddressResult } from '../address.result.interface';


export class BitcoinHDWallet {

    derivePath: string;
    mnemonic: string;
    seed: Buffer;
    root: any;

    constructor(mnemonic?: string, options?: {
        derivePath: string,
    }) {
        // Rastgele mnemonic oluştur
        this.mnemonic = mnemonic ? mnemonic : bip39.generateMnemonic();
        this.derivePath = options ? options.derivePath : "m/44'/60'/0'/0";

        // Mnemonic'ten seed oluştur
        this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
        // Seed'den root düğümünü oluştur
        this.root = BIP32Factory(ecc).fromSeed(this.seed);
    }

    generateAddresses(indexCount: number) : IAddressResult[] {
        const addresses = [];

        for (let i = 0; i < indexCount; i++) {
            // Belirtilen index için bir child node oluşturun
            const childNode = this.root.derivePath(`${this.derivePath}/${i}`);
            // Adres, public key ve private key'i alın
            const { address } = bitcoin.payments.p2pkh({ pubkey: childNode.publicKey });
            const publicKey = childNode.publicKey.toString('hex');
            const privateKey = childNode.toWIF();

            addresses.push({
                index: i,
                address,
                publicKey,
                privateKey
            });
        }

        return addresses;
    }
}