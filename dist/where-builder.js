"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhereBuilder = void 0;
const sequelize_1 = require("sequelize");
const builder_abstract_1 = require("./builder-abstract");
const sql_generator_1 = require("./sql-generator");
class WhereBuilder extends builder_abstract_1.BuilderAbstract {
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
    getQuery() {
        const { request } = this;
        const query = {};
        const { columnTypes, includeMap } = this.extractColumnTypes();
        for (const [key, value] of Object.entries(request)) {
            if (key === '_q' && value !== '') {
                const numberVal = parseInt(value);
                const searchColumns = this.getSearchableColumns(columnTypes);
                const uuidColumns = this.getPotentialUUIDColumns(columnTypes);
                const numberColumns = this.getNumberColumns(columnTypes);
                query[sequelize_1.Op.or] = searchColumns.map((column) => ({
                    [column]: { [sequelize_1.Op.like]: `%${this.escapeSearchQuery(value)}%` },
                })).concat(uuidColumns.map((column) => ({
                    [column]: { [sequelize_1.Op.eq]: `${this.escapeSearchQuery(value)}` },
                }))).concat(Number.isNaN(numberVal) ? [] : numberColumns.map((column) => ({
                    [column]: { [sequelize_1.Op.eq]: `${parseInt(value)}` },
                })));
            }
            const columnType = columnTypes[key];
            if (columnType) {
                query[key] = this.parseFilterValue(value, columnType);
            }
            else if (this.config["filter-includes"]) {
                const result = this.applySubQuery(key, includeMap, value);
                if (result) {
                    query[result.col] = result.filter;
                }
            }
        }
        return query;
    }
    applySubQuery(key, map, value) {
        if (!key.includes('.')) {
            return undefined;
        }
        const [model, ...rest] = key.split('.');
        if (map[model] && map[model].association.source.tableName == this.Model.tableName) {
            if (rest.length > 1) {
                if (map[model].includeMap)
                    return this.applySubQuery(rest.join('.'), map[model].includeMap, value);
                return undefined;
            }
            else {
                const builder = new WhereBuilder(map[model].model, { [rest[0]]: value });
                const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(map[model].model, { where: builder.getQuery(), attributes: ['id'] });
                return {
                    col: map[model].association.foreignKey,
                    filter: {
                        [sequelize_1.Op.in]: `(${subQuery})`
                    }
                };
            }
        }
    }
    escapeSearchQuery(query) {
        // Escape special characters
        return query.replace(/[%_]/g, '\\$&');
    }
    getSearchableColumns(columnTypes) {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType === 'STRING')
            .map(([columnName, type]) => columnName);
    }
    getNumberColumns(columnTypes) {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType === 'NUMBER' || columnType === 'INTEGER' || columnType === 'DECIMAL')
            .map(([columnName, type]) => columnName);
    }
    getPotentialUUIDColumns(columnTypes) {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType?.startsWith('UUID'))
            .map(([columnName, type]) => columnName);
    }
    parseFilterValue(value, columnType) {
        if (typeof value === 'object' && value !== null) {
            const operators = Object.keys(value);
            if (operators.length === 1) {
                const operator = operators[0];
                const filterValue = value[operator];
                switch (operator) {
                    case 'gt':
                        return { [sequelize_1.Op.gt]: this.parseValue(filterValue, columnType) };
                    case 'lt':
                        return { [sequelize_1.Op.lt]: this.parseValue(filterValue, columnType) };
                    case 'gte':
                        return { [sequelize_1.Op.gte]: this.parseValue(filterValue, columnType) };
                    case 'lte':
                        return { [sequelize_1.Op.lte]: this.parseValue(filterValue, columnType) };
                    case 'ne':
                        return { [sequelize_1.Op.ne]: this.parseValue(filterValue, columnType) };
                    case 'eq':
                        return { [sequelize_1.Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'in':
                        if (Array.isArray(filterValue)) {
                            return { [sequelize_1.Op.in]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [sequelize_1.Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'between':
                        return { [sequelize_1.Op.between]: [this.parseValue(filterValue[0], columnType), this.parseValue(filterValue[1], columnType)] };
                    case 'like':
                        return { [sequelize_1.Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                    case 'contains':
                        return { [sequelize_1.Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                }
            }
        }
        return this.parseValue(value, columnType);
    }
    parseValue(value, columnType, escape = false) {
        if (columnType === 'BOOLEAN') {
            return value === 'true';
        }
        else if (columnType === 'INTEGER' || columnType === 'FLOAT') {
            return Number(value);
        }
        else if (columnType === 'STRING') {
            return escape ? this.sequelize.escape(value) : value;
        }
        else if (columnType === 'DATE') {
            return new Date(value);
        }
        else {
            // Handle other column types as needed
            return escape ? this.sequelize.escape(value) : value;
        }
    }
}
exports.WhereBuilder = WhereBuilder;
