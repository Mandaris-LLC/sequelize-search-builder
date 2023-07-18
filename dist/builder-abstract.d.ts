import * as qs from 'qs';
import { Config } from './config';
import { ModelStatic, Sequelize } from 'sequelize';
export declare class BuilderAbstract {
    protected Model: ModelStatic<any>;
    protected config: Config;
    protected request: qs.ParsedQs;
    protected sequelize: Sequelize;
    constructor(Model: ModelStatic<any>, request?: qs.ParsedQs, config?: Partial<Config>);
    /**
     * Transform request to request object
     * @param {(Object|string)} request
     *
     * @returns {Object}
     */
    static prepareRequest(request?: qs.ParsedQs): qs.ParsedQs;
}
