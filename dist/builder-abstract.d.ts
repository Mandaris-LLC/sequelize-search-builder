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
    protected globalRequest: qs.ParsedQs;
    protected sequelize: Sequelize;
    constructor(Model: SeqModelLike, request?: qs.ParsedQs, globalRequest?: qs.ParsedQs, config?: Partial<Config>);
    protected getColumnTypes(): {
        columnTypes: {
            [key: string]: string;
        };
    };
    protected getIncludeMaps(): {
        includeMap: IncludeMap;
    };
    private mergeMap;
    private _getIncludeMaps;
    /**
     * Transform request to request object
     * @param {(Object|string)} request
     *
     * @returns {Object}
     */
    static prepareRequest(request?: qs.ParsedQs): qs.ParsedQs;
}
