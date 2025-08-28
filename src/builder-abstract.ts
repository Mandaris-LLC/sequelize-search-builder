import * as qs from 'qs'
import { merge } from 'lodash'
import defaultConfig, { Config } from './config';
import { Sequelize } from 'sequelize';
import { isObjectArray } from './util';

export type IncludeMap = { [key: string]: any }

export interface SeqModelLike {
    sequelize: Sequelize,
    rawAttributes: { [key: string]: any }
    getTableName(): string | { tableName: string; schema: string; delimiter: string; };
    name: string;
}

export class BuilderAbstract {
    protected config: Config;
    protected request: qs.ParsedQs;
    protected globalRequest: qs.ParsedQs;
    protected sequelize: Sequelize;

    constructor(protected Model: SeqModelLike, request: qs.ParsedQs = {}, globalRequest: qs.ParsedQs = {}, config: Partial<Config> = {}) {
        if (new.target === BuilderAbstract) {
            throw new TypeError('Cannot construct BuilderAbstract instances directly');
        }
        this.sequelize = Model.sequelize!
        this.request = BuilderAbstract.prepareRequest(request);
        this.globalRequest = BuilderAbstract.prepareRequest(globalRequest);
        if (this.globalRequest['searchColumns'] && isObjectArray(this.globalRequest['searchColumns'])) {
            this.globalRequest['searchColumns'] = Object.values(this.globalRequest['searchColumns']) as string[]
        }
        this.config = merge(defaultConfig, config);
    }

    protected extractColumnTypes(all: boolean = false): { columnTypes: { [key: string]: string }, includeMap: IncludeMap } {
        const columnTypes: { [key: string]: string } = {};

        let options = all ? { include: [{ all: true }] } as any : {};
        const tableNames = {} as any;

        tableNames[(this.Model as any).getTableName(options)] = true;

        (this.Model as any)._injectScope(options);

        if ('_conformOptions' in this.Model) {
            (this.Model as any)._conformOptions(options, this.Model);
        } else if ('_conformIncludes' in this.Model) {
            (this.Model as any)._conformIncludes(options, this.Model);
        }
        (this.Model as any)._expandAttributes(options);
        (this.Model as any)._expandIncludeAll(options);

        if (options.include) {
            options.hasJoin = true;
            (this.Model as any)._validateIncludedElements(options, tableNames);
        }
        if (!options.attributes) {
            options.attributes = Object.keys((this.Model as any).tableAttributes);
        }

        for (const [attributeName, attribute] of Object.entries(this.Model.rawAttributes)) {
            columnTypes[attributeName] = typeof attribute.type === 'string' ? attribute.type : (attribute.type as any).key;
        }

        const includeMap = options.includeMap
        return { columnTypes, includeMap };
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