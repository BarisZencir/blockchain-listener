import { Wallet } from "src/wallet/wallet.model";


export class GetFreeAddressResponse {

    blockchainName : Wallet["blockchainName"];
    index: Wallet["index"];
    address : Wallet["address"];
}
