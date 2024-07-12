import { Wallet } from "../wallet.model";


export class GetFreeAddressResponse {

    blockchainName : Wallet["blockchainName"];
    index: Wallet["index"];
    address : Wallet["address"];
}
