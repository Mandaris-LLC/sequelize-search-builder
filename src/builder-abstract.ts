import * as qs from 'qs'
import { merge } from 'lodash'
import defaultConfig, { Config } from './config';
import { Sequelize } from 'sequelize';

export interface SeqModelLike {
    sequelize: Sequelize,
    rawAttributes: { [key: string]: any }
    getTableName(): string | { tableName: string; schema: string; delimiter: string; };
    name: string;
}

export class BuilderAbstract {
    protected config: Config;
    protected request: qs.ParsedQs;
    protected sequelize: Sequelize;

    constructor(protected Model: SeqModelLike, request: qs.ParsedQs = {}, config: Partial<Config> = {}) {
        if (new.target === BuilderAbstract) {
            throw new TypeError('Cannot construct BuilderAbstract instances directly');
        }
        this.sequelize = Model.sequelize!
        this.request = BuilderAbstract.prepareRequest(request);
        this.config = merge(defaultConfig, config);
    }

    /**
     * Transform request to request object
     * @param {(Object|string)} request
     *
     * @returns {Object}
     */
    static prepareRequest(request: qs.ParsedQs = {}) {
        if (typeof request === 'string') {
            return qs.parse(request, { ignoreQueryPrefix: true });
        }

        return request || {};
    }
}