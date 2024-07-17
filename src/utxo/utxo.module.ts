import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Utxo, UtxoSchema } from './utxo.model';
import { UtxoService } from './utxo.service';
import { UtxoRepository } from './utxo.repository';
 
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Utxo.name, schema: UtxoSchema }]),
  ],
  exports: [UtxoService],
  providers: [
    UtxoRepository,
    UtxoService],
  controllers: [],
})
export class UtxoModule {}
