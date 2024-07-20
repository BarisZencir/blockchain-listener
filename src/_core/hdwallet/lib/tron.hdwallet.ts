import * as TronWeb from 'tronweb';
import * as bip39 from 'bip39';
import * as hdkey from 'hdkey';
import { Buffer } from 'buffer';

export interface IAddressResult {
    index: number;
    address: string;
    publicKey: string;
    privateKey: string;
}

export class TronHDWallet {
    derivePath: string;
    mnemonic: string;
    hdKey: hdkey;

    constructor(mnemonic?: string, options?: { derivePath: string }) {
        this.derivePath = options ? options.derivePath : "m/44'/195'/0'/0";
        this.mnemonic = mnemonic ? mnemonic : bip39.generateMnemonic();
        const seed = bip39.mnemonicToSeedSync(this.mnemonic);
        this.hdKey = hdkey.fromMasterSeed(seed);
    }

    generateAddresses(indexCount: number): IAddressResult[] {
        const addresses = [];

        for (let i = 0; i < indexCount; i++) {
            const childKey = this.hdKey.derive(`${this.derivePath}/${i}`);
            const privateKeyHex = childKey.privateKey.toString('hex');
            const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
            const privateKeyBase64 = privateKeyBuffer.toString('base64');
            
            // Generate TRON address from base64 encoded private key
            const tronAddress = TronWeb.utils.crypto.getBase58CheckAddressFromPriKeyBase64String(privateKeyBase64);
            const publicKey = childKey.publicKey.toString('hex');

            addresses.push({
                index: i,
                address: tronAddress,
                publicKey,
                privateKey: privateKeyHex
            });
        }

        return addresses;
    }
}