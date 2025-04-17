"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderAbstract = void 0;
const qs = require("qs");
const lodash_1 = require("lodash");
const config_1 = require("./config");
class BuilderAbstract {
    constructor(Model, request = {}, config = {}) {
        this.Model = Model;
        if (new.target === BuilderAbstract) {
            throw new TypeError('Cannot construct BuilderAbstract instances directly');
        }
        this.sequelize = Model.sequelize;
        this.request = BuilderAbstract.prepareRequest(request);
        this.config = (0, lodash_1.merge)(config_1.default, config);
    }
    extractColumnTypes() {
        const columnTypes = {};
        let options = {};
        const tableNames = {};
        tableNames[this.Model.getTableName(options)] = true;
        this.Model._injectScope(options);
        if ('_conformOptions' in this.Model) {
            this.Model._conformOptions(options, this.Model);
        }
        else if ('_conformIncludes' in this.Model) {
            this.Model._conformIncludes(options, this.Model);
        }
        this.Model._expandAttributes(options);
        this.Model._expandIncludeAll(options);
        if (options.include) {
            options.hasJoin = true;
            this.Model._validateIncludedElements(options, tableNames);
        }
        if (!options.attributes) {
            options.attributes = Object.keys(this.Model.tableAttributes);
        }
        for (const [attributeName, attribute] of Object.entries(this.Model.rawAttributes)) {
            columnTypes[attributeName] = attribute.type.key;
        }
        const includeMap = options.includeMap;
        return { columnTypes, includeMap };
    }
    /**
     * Transform request to request object
     * @param {(Object|string)} request
     *
     * @returns {Object}
     */
    static prepareRequest(request = {}) {
        if (typeof request === 'string') {
            return qs.parse(request, { ignoreQueryPrefix: true });
        }
        return request || {};
    }
}
exports.BuilderAbstract = BuilderAbstract;
