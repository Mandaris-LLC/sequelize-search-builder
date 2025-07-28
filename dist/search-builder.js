"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
const order_builder_1 = require("./order-builder");
const where_builder_1 = require("./where-builder");
const summary_builder_1 = require("./summary-builder");
const attribute_builder_1 = require("./attribute-builder");
const group_builder_1 = require("./group-builder");
const constructors = {
    filter: where_builder_1.WhereBuilder,
    order: order_builder_1.OrderBuilder,
};
class SearchBuilder extends builder_abstract_1.BuilderAbstract {
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
    getQueryByType(type) {
        const request = this.request[this.config.fields[type]];
        return SearchBuilder
            .prepareResponse(new constructors[type](this.Model, request, this.globalRequest, this.config)
            .getQuery());
    }
    getSummaryQueries() {
        const summaryBuilder = new summary_builder_1.SummaryBuilder(this.Model, this.request, this.globalRequest, this.config);
        return summaryBuilder.getQuery();
    }
    getGroupQuery() {
        const builder = new group_builder_1.GroupBuilder(this.Model, this.request, this.globalRequest, this.config);
        return builder.getQuery();
    }
    getAttributes() {
        const summaryBuilder = new attribute_builder_1.AttributeBuilder(this.Model, this.request, this.globalRequest, this.config);
        return summaryBuilder.getAttributes();
    }
    getParanoid() {
        return this.request['deleted'] ? false : undefined;
    }
    /**
     * Get string with limit value
     * @returns {(int|null)} limit value
     */
    getLimitQuery() {
        if (this.request[this.config.fields.loadingAll]) {
            return null;
        }
        const limit = SearchBuilder.prepareIntegerQuery(this.request[this.config.fields.limit]);
        if (limit === -1) {
            return null;
        }
        if (!limit && this.getAttributes()?.length) {
            return null;
        }
        return limit || null;
    }
    /**
     * Get string with offset value
     * @returns {(int|null)} offset value
     */
    getOffsetQuery() {
        return SearchBuilder.prepareIntegerQuery(this.request[this.config.fields.offset]) || null;
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
    static prepareResponse(query) {
        return (Object.keys(query).length === 0
            && Object.getOwnPropertySymbols(query).length === 0) ? null : query;
    }
    /**
     * Prepare integer response (limit and offset values)
     * @param {string} string value
     * @returns {(int|null)} integer value
     */
    static prepareIntegerQuery(query) {
        const intQuery = parseInt(query, 10);
        return (Number.isInteger(intQuery) && intQuery >= 0) ? intQuery : null;
    }
}
exports.SearchBuilder = SearchBuilder;
