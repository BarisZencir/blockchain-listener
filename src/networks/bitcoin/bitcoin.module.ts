import { Module } from '@nestjs/common';
import { BitcoinService } from './bitcoin.service';

@Module({
    imports: [],
    exports: [BitcoinService],
    providers: [
        BitcoinService],
    controllers: [],
})
export class BitcoinModule { }
