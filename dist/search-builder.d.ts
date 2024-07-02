import { ParsedQs } from "qs";
import { BuilderAbstract } from "./builder-abstract";
export declare class SearchBuilder extends BuilderAbstract {
    /**
     * Get object with sequelize where conditions
     * @returns {(Object|null)} sequelize where query
     */
    getWhereQuery(): any;
    /**
     * Get object with sequelize order conditions
     * @returns {(Object|null)} sequelize order query
     */
    getOrderQuery(): any;
    /**
     * Get object with sequelize conditions by type
     * @param {string} type
     * @returns {(Object|null)} sequelize query
     */
    getQueryByType(type: 'filter' | 'order'): any;
    getSummaryQueries(): {
        [key: string]: {
            field: string;
            function: string;
        };
    };
    getAttributes(): string[] | undefined;
    getParanoid(): true | undefined;
    /**
     * Get string with limit value
     * @returns {(int|null)} limit value
     */
    getLimitQuery(): number | null;
    /**
     * Get string with offset value
     * @returns {(int|null)} offset value
     */
    getOffsetQuery(): number | null;
    /**
     * Get object with all sequelize conditions (where, order, limit, offset)
     * @returns {Object} sequelize queries with all conditions
     */
    getFullQuery(): {
        where: any;
        order: any;
        limit: number | null;
        offset: number | null;
    };
    /**
     * Prepare sequelize query for response
     * @param {Object} sequelize query
     * @returns {(Object|null)} sequelize query
     */
    static prepareResponse(query: ParsedQs): ParsedQs | null;
    /**
     * Prepare integer response (limit and offset values)
     * @param {string} string value
     * @returns {(int|null)} integer value
     */
    static prepareIntegerQuery(query: string): number | null;
}
