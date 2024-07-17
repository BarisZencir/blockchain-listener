import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { IAddressResult } from '../address.result.interface';
const bip32 = BIP32Factory(ecc);

interface NetworkConfig {
    baseNetwork: string;
    messagePrefix: string;
    bech32: string;
    bip32: {
      public: number;
      private: number;
    };
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
  }
  
  const networks: { [key: string]: NetworkConfig } = {
    bitcoin: {
      baseNetwork: 'bitcoin',
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'bc',
      bip32: {
        public: 0x04b24746,
        private: 0x04b2430c,
      },
      pubKeyHash: 0x00,
      scriptHash: 0x05,
      wif: 0x80,
    },
    testnet: {
      baseNetwork: 'testnet',
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'tb',
      bip32: {
        public: 0x045f1cf6,
        private: 0x045f18bc,
      },
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
    },
    regtest: {
      baseNetwork: 'regtest',
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'bcrt',
      bip32: {
        public: 0x045f1cf6,
        private: 0x045f18bc,
      },
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
    },
  };
  

export class BitcoinHDWallet {

    derivePath: string;
    mnemonic: string;
    seed: Buffer;
    root: any;
    network : NetworkConfig;

    constructor(mnemonic?: string, options?: {
        derivePath: string,
        networkName : string
    }) {
        // Rastgele mnemonic oluştur
        this.mnemonic = mnemonic ? mnemonic : bip39.generateMnemonic();
        this.derivePath = options ? options.derivePath : "m/44'/0'/0'"; // Default path güncellendi
        this.network = networks[options.networkName || "bitcoin"];

        // Mnemonic'ten seed oluştur
        this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
        // Seed'den root düğümünü oluştur
        this.root = bip32.fromSeed(this.seed, this.network);
    }

    generateAddresses(indexCount: number): IAddressResult[] {
        const addresses: IAddressResult[] = [];

        const account = this.root.derivePath(this.derivePath);
  
        for (let i = 0; i < indexCount; i++) {
          const external = account.derive(i);
          addresses.push({
            index : i,
            address: bitcoin.payments.p2wpkh({
              pubkey: external.publicKey,
              network: this.network,
            }).address,
            publicKey : external.publicKey.toString('hex'),
            privateKey: external.toWIF(),
          });
        }      
        return addresses;
    }
}