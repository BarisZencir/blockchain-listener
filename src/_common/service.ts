import { Document, Types as MongooseTypes } from 'mongoose';
import { BaseModel } from './model/base.model';
import { Repository } from "./repository";

export class Service<M extends BaseModel, D extends M & Document, R extends Repository<M, D>> {

    constructor(protected readonly repository: R) {}

    public async save(model: Partial<M>): Promise<M> {
        return this.repository.save(model);
    }
    
    async exists(filter: any): Promise<boolean> {
        return this.repository.exists(filter);
    }

    async existsById(_id: BaseModel["_id"]): Promise<boolean> {
        return this.repository.existsById(_id);
    }

    public async find(filter: any): Promise<(M)[]> {
        return this.repository.find(filter);
    }

    public async findAll(): Promise<(M)[]> {
        return this.repository.findAll();
    }

    public async findOne(filter: any): Promise<M> {
        return this.repository.findOne(filter);
    }

    public async findById(_id: BaseModel["_id"]): Promise<M> {
        return this.repository.findById(_id);
    }

    public async deleteById(_id: BaseModel["_id"]): Promise<void> {
        this.repository.deleteById(_id);
    }

    public async updateById(_id: BaseModel["_id"], dto: M): Promise<M> {
        return this.repository.updateById(_id, dto);
    }

    public async update(dto: M): Promise<M> {
        return this.repository.update(dto);
    }
}
