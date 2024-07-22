import { Body, Controller, Logger, Post, UseFilters, UseGuards } from "@nestjs/common";
import { GetFreeAddressResponse } from "./dto/wallet.response.dto";
import { GetFreeAddressRequest, IsAddressExistsRequest } from "./dto/wallet.request.dto";
import { WalletService } from "./wallet.service";
import { BlockchainName } from "src/_common/enums/blockchain.name.enums";
import { Wallet } from "./wallet.model";

@Controller('wallet')
export class WalletController {

    private readonly logger = new Logger(WalletController.name);
    constructor(
        private walletService : WalletService
        
        ) {
    }

    @Post("getFreeAddress")
    async getFreeAddress(
        @Body() request: GetFreeAddressRequest
    ): Promise<GetFreeAddressResponse> {

        this.logger.debug("getFreeAddress started.");
        let response = new GetFreeAddressResponse();

        let nextWallet = await this.walletService.findNextAvailableAddressAndUpdate(request.blockchainName);
        console.log("nextWallet : " + nextWallet);
        if(nextWallet) {            
            response.index = nextWallet.index;
            response.blockchainName = nextWallet.blockchainName;
            response.address = nextWallet.address;

        }        
    
        this.logger.debug("getFreeAddress done.");
        return response;
    }

    @Post("isAddressExists")
    async isAddressExists(
        @Body() request: IsAddressExistsRequest
    ): Promise<boolean> {

        this.logger.debug("getFreeAddress started.");
        return this.walletService.exists({
            blockchainName : request.blockchainName,
            available : false
        });
    }

}
