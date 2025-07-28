import { ParsedQs } from "qs";
import { BuilderAbstract } from "./builder-abstract";
import { OrderBuilder } from "./order-builder";
import { WhereBuilder } from "./where-builder";
import { SummaryBuilder } from "./summary-builder";
import { AttributeBuilder } from "./attribute-builder";
import { GroupBuilder } from "./group-builder";

const constructors = {
    filter: WhereBuilder,
    order: OrderBuilder,
};

export class SearchBuilder extends BuilderAbstract {
    /**
     * Get object with sequelize where conditions
     * @returns {(Object|null)} sequelize where query
     */
    getWhereQuery() {
        return this.getQueryByType('filter');
    }

    /**
     * Get object with sequelize order conditions
     * @returns {(Object|null)} sequelize order query
     */
    getOrderQuery() {
        return this.getQueryByType('order');
    }

    /**
     * Get object with sequelize conditions by type
     * @param {string} type
     * @returns {(Object|null)} sequelize query
     */
    getQueryByType(type: 'filter' | 'order') {
        const request = this.request[this.config.fields[type]] as ParsedQs;
        return SearchBuilder
            .prepareResponse(new constructors[type](this.Model, request, this.globalRequest, this.config)
                .getQuery()) as any;
    }

    getSummaryQueries() {
        const summaryBuilder = new SummaryBuilder(this.Model, this.request, this.globalRequest, this.config)
        return summaryBuilder.getQuery()
    }

    getGroupQuery() {
        const builder = new GroupBuilder(this.Model, this.request, this.globalRequest, this.config)
        return builder.getQuery()
    }

    getAttributes() {
        const summaryBuilder = new AttributeBuilder(this.Model, this.request, this.globalRequest, this.config)
        return summaryBuilder.getAttributes()
    }

    getParanoid() {
        return this.request['deleted'] ? false : undefined
    }

    /**
     * Get string with limit value
     * @returns {(int|null)} limit value
     */
    getLimitQuery() {
        if (this.request[this.config.fields.loadingAll]) {
            return null
        }
        const limit = SearchBuilder.prepareIntegerQuery(this.request[this.config.fields.limit] as string)
        if (limit === -1) {
            return null
        }
        if (!limit && this.getAttributes()?.length) {
            return null
        }
        return limit || null;
    }

    /**
     * Get string with offset value
     * @returns {(int|null)} offset value
     */
    getOffsetQuery() {
        return SearchBuilder.prepareIntegerQuery(this.request[this.config.fields.offset] as string) || null;
    }

    /**
     * Get object with all sequelize conditions (where, order, limit, offset)
     * @returns {Object} sequelize queries with all conditions
     */
    getFullQuery() {
        return Object.assign({}, {}, {
            where: this.getWhereQuery(),
            order: this.getOrderQuery(),
            limit: this.getLimitQuery(),
            offset: this.getOffsetQuery(),
        });
    }

    /**
     * Prepare sequelize query for response
     * @param {Object} sequelize query
     * @returns {(Object|null)} sequelize query
     */
    static prepareResponse(query: ParsedQs) {
        return (Object.keys(query).length === 0
            && Object.getOwnPropertySymbols(query).length === 0) ? null : query;
    }

    /**
     * Prepare integer response (limit and offset values)
     * @param {string} string value
     * @returns {(int|null)} integer value
     */
    static prepareIntegerQuery(query: string) {
        const intQuery = parseInt(query, 10);
        return (Number.isInteger(intQuery) && intQuery >= 0) ? intQuery : null;
    }
}