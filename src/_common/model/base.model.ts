import { Type } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from 'mongoose';
import { Document, Types as MongooseTypes} from 'mongoose';
import { AppVersion, CURRENT_APP_VERSION } from '../enums/app-version';

@Schema()
export class HasId {
    _id: MongooseTypes.ObjectId;

    get id(): string {
        return this._id?.toString();
    }

    set id(value: string) {
        this._id = new MongooseTypes.ObjectId(value);
    }
}

@Schema()
export class HasAppVersion extends HasId {
    @Prop({
        default: CURRENT_APP_VERSION
    })
    appVersion: number;
}

@Schema()
export class Audited extends HasAppVersion {
    @Prop({default: Date.now})
    createdDate: Date;

    @Prop({default: Date.now})
    updatedDate: Date;

	// @Prop()
	// createdUserId: string;

	// @Prop()
	// updatedUserId: string;
}

@Schema()
export class BaseModel extends Audited {

}


export function createSchema<TClass extends BaseModel = any>(target: Type<TClass>){
    let schema = SchemaFactory.createForClass(target);

    schema.pre<TClass & Document>('save', async function () {

        var data = this;

        if (this.isNew) {
            data.createdDate = new Date();            
            
            // if(data.id) {
            //     //populate edilecek propertiler icin gerekli.
            //     let _id = new MongooseTypes.ObjectId(data.id);
            //     data._id = _id;                
            // }
        }

        data.updatedDate = new Date();
    });

    // schema.virtual('xid').get(function() {
    //     return this._id.toString();
    // });

    //not: main.js'e var __setOptions = Query.prototype.setOptions; bak.
    schema.plugin(require('mongoose-lean-virtuals'));
    schema.plugin(require('mongoose-autopopulate'));

    return schema;
}

export function createDefaultSchema<TClass extends any = any>(target: Type<TClass>){
    let schema = SchemaFactory.createForClass(target);
    //not: main.js'e var __setOptions = Query.prototype.setOptions; bak.
    schema.plugin(require('mongoose-lean-virtuals'));
    schema.plugin(require('mongoose-autopopulate'));

    return schema;
}