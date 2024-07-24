import { Model, Document } from 'mongoose';
import { BaseModel} from './model/base.model';

export class Repository<M extends BaseModel, D extends M & Document> {

    constructor(protected readonly mongoModel: Model<D>) {}

    async save(model: Partial<M>): Promise<M> {
        const createdModel: D = new this.mongoModel(model);
        return createdModel.save();
    }
    
    async exists(filter: any): Promise<boolean> {
        filter = filter || {};
        let result = await this.mongoModel.findOne(filter).lean({ virtuals: true, autopopulate: true });        
        return !!result;
    }

    async existsById(_id: BaseModel["_id"]): Promise<boolean> {
        return this.exists({_id: _id});
    }

    async find(filter: any): Promise<(M)[]> {
        filter = filter || {};
        return this.mongoModel.find(filter).lean({ virtuals: true, autopopulate: true });
    }

    async findByLimit(filter: any, limit : number): Promise<(M)[]> {
        filter = filter || {};
        return this.mongoModel.find(filter).limit(limit).lean({ virtuals: true, autopopulate: true });
    }

    
    async findAll(): Promise<(M)[]> {
        return this.mongoModel.find().lean({ virtuals: true, autopopulate: true });
    }

    async findOne(filter: any): Promise<M> {
        filter = filter || {};
        return this.mongoModel.findOne(filter).lean({ virtuals: true, autopopulate: true });
    }

    async findById(_id: BaseModel["_id"]): Promise<M> {
        return this.mongoModel.findById(_id).lean({ virtuals: true, autopopulate: true });
    }

    async deleteById(_id: BaseModel["_id"]): Promise<void> {
        this.mongoModel.deleteOne({ _id: _id }).exec();
    }

    async updateById(_id: BaseModel["_id"], dto: M): Promise<M> {
        return this.mongoModel.findByIdAndUpdate({ _id: _id }, dto, {new: true});
    }

    async update(dto: M): Promise<M> {
        return await this.updateById(dto._id, dto);
    }
}
