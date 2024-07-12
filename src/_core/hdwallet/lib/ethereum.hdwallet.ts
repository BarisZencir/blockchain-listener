import { ethers } from 'ethers';
import { IAddressResult } from '../address.result.interface';

export class EthereumHDWallet {
  derivePath : string;
  mnemonic: string;
  hdNodeWallet: ethers.HDNodeWallet;

  constructor(mnemonic?: string, options? : {
    derivePath : string,
  }) {
    this.derivePath = options ? options.derivePath : "44'/60'/0'/0";
    this.mnemonic = mnemonic ? mnemonic : ethers.Wallet.createRandom().mnemonic.phrase;
    this.hdNodeWallet = ethers.HDNodeWallet.fromPhrase(this.mnemonic);
  }

  generateAddresses(indexCount: number) : IAddressResult[] {
    const addresses = [];

    for (let i = 0; i < indexCount; i++) {
      const childNode = this.hdNodeWallet.derivePath(`${this.derivePath}/${i}`);
      const address = childNode.address;
      const publicKey = childNode.publicKey;
      const privateKey = childNode.privateKey;

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

