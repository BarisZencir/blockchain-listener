
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { BlockchainName } from 'src/_common/enums/blockchain.name.enums';


export class GetFreeAddressRequest {
    blockchainName : BlockchainName;
}
