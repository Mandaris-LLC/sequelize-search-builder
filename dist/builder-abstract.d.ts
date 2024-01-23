import * as qs from 'qs';
import { Config } from './config';
import { Sequelize } from 'sequelize';
interface SeqModelLike {
    sequelize: Sequelize;
    rawAttributes: {
        [key: string]: any;
    };
    getTableName(): {
        tableName: string;
        schema: string;
        delimiter: string;
    };
}
export declare class BuilderAbstract {
    protected Model: SeqModelLike;
    protected config: Config;
    protected request: qs.ParsedQs;
    protected sequelize: Sequelize;
    constructor(Model: SeqModelLike, request?: qs.ParsedQs, config?: Partial<Config>);
    /**
     * Transform request to request object
     * @param {(Object|string)} request
     *
     * @returns {Object}
     */
    static prepareRequest(request?: qs.ParsedQs): qs.ParsedQs;
}
export {};
