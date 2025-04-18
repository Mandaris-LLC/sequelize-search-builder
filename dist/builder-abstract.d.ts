import * as qs from 'qs';
import { Config } from './config';
import { Sequelize } from 'sequelize';
export type IncludeMap = {
    [key: string]: any;
};
export interface SeqModelLike {
    sequelize: Sequelize;
    rawAttributes: {
        [key: string]: any;
    };
    getTableName(): string | {
        tableName: string;
        schema: string;
        delimiter: string;
    };
    name: string;
}
export declare class BuilderAbstract {
    protected Model: SeqModelLike;
    protected config: Config;
    protected request: qs.ParsedQs;
    protected sequelize: Sequelize;
    constructor(Model: SeqModelLike, request?: qs.ParsedQs, config?: Partial<Config>);
    protected extractColumnTypes(): {
        columnTypes: {
            [key: string]: string;
        };
        includeMap: IncludeMap;
    };
    /**
     * Transform request to request object
     * @param {(Object|string)} request
     *
     * @returns {Object}
     */
    static prepareRequest(request?: qs.ParsedQs): qs.ParsedQs;
}
