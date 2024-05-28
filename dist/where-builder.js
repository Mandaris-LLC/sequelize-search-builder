"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhereBuilder = void 0;
const sequelize_1 = require("sequelize");
const builder_abstract_1 = require("./builder-abstract");
const sql_generator_1 = require("./sql-generator");
function isNumber(num) {
    if (typeof num === 'number') {
        return num - num === 0;
    }
    if (typeof num === 'string' && num.trim() !== '') {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
    }
    return false;
}
;
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
                const searchColumns = this.getSearchableColumns(columnTypes);
                const uuidColumns = this.getPotentialUUIDColumns(columnTypes);
                const numberColumns = this.getNumberColumns(columnTypes);
                query[sequelize_1.Op.or] = searchColumns.map((column) => ({
                    [column]: { [sequelize_1.Op.like]: `%${this.escapeSearchQuery(value)}%` },
                })).concat(uuidColumns.map((column) => ({
                    [column]: { [sequelize_1.Op.eq]: `${this.escapeSearchQuery(value)}` },
                }))).concat((!isNumber(value)) ? [] : numberColumns.map((column) => ({
                    [column]: { [sequelize_1.Op.eq]: `${value}` },
                })));
                if (this.config["filter-includes"]) {
                    for (const model in includeMap) {
                        if (!includeMap[model].association.through) {
                            const builder = new WhereBuilder(includeMap[model].model, request);
                            if (includeMap[model].association.associationType !== 'HasMany') {
                                const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(includeMap[model].model.unscoped(), { where: builder.getQuery(), attributes: ['id'] });
                                query[sequelize_1.Op.or].push({
                                    [includeMap[model].association.foreignKey]: {
                                        [sequelize_1.Op.in]: this.sequelize.literal(`(${subQuery})`)
                                    }
                                });
                            }
                            else {
                                const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(includeMap[model].model.unscoped(), { where: builder.getQuery(), attributes: [includeMap[model].association.foreignKey] });
                                query[sequelize_1.Op.or].push({
                                    [includeMap[model].association.sourceKey]: {
                                        [sequelize_1.Op.in]: this.sequelize.literal(`(${subQuery})`)
                                    }
                                });
                            }
                        }
                    }
                }
            }
            else if (key == 'or' || key == 'and') {
                if (Array.isArray(value)) {
                    query[(key == 'or' ? sequelize_1.Op.or : sequelize_1.Op.and)] = [];
                    value.forEach((value) => {
                        const builder = new WhereBuilder(this.Model, value);
                        query[(key == 'or' ? sequelize_1.Op.or : sequelize_1.Op.and)].push(builder.getQuery());
                    });
                }
                else {
                    const builder = new WhereBuilder(this.Model, value);
                    query[(key == 'or' ? sequelize_1.Op.or : sequelize_1.Op.and)] = builder.getQuery();
                }
            }
            else {
                const columnType = columnTypes[key];
                if (columnType) {
                    query[key] = this.parseFilterValue(value, columnType);
                }
                else if (this.config["filter-includes"]) {
                    const result = this.getSubQueryOptions(this.Model, key, includeMap, value);
                    if (result) {
                        query[result.col] = result.filter;
                    }
                }
            }
        }
        return query;
    }
    getSubQueryOptions(parentModel, key, map, value) {
        if (!key.includes('.')) {
            return undefined;
        }
        const [model, ...rest] = key.split('.');
        if (map[model] && map[model].association.source.tableName == parentModel.tableName) {
            if (rest.length > 1) {
                if (map[model].includeMap) {
                    const subOptions = this.getSubQueryOptions(map[model].model, rest.join('.'), map[model].includeMap, value);
                    if (!subOptions) {
                        return undefined;
                    }
                    const attributes = map[model].association.associationType === 'HasMany' ? [map[model].association.foreignKey] : ['id'];
                    const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(map[model].model, {
                        where: {
                            [subOptions.col]: subOptions.filter
                        },
                        attributes: attributes,
                        raw: true
                    });
                    return {
                        col: map[model].association.associationType === 'HasMany' ? map[model].association.sourceKey : map[model].association.foreignKey,
                        filter: {
                            [sequelize_1.Op.in]: this.sequelize.literal(`(${subQuery})`)
                        }
                    };
                }
                return undefined;
            }
            else {
                if (value['not'] && value['not'] === 'null') {
                    return {
                        col: map[model].association.foreignKey,
                        filter: {
                            [sequelize_1.Op.not]: null
                        }
                    };
                }
                else if (value['is'] && value['is'] === 'null') {
                    return {
                        col: map[model].association.foreignKey,
                        filter: {
                            [sequelize_1.Op.is]: null
                        }
                    };
                }
                const builder = new WhereBuilder(map[model].model, { [rest[0]]: value });
                const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(map[model].model, { where: builder.getQuery(), attributes: ['id'] });
                return {
                    col: map[model].association.associationType === 'HasMany' ? map[model].association.sourceKey : map[model].association.foreignKey,
                    filter: {
                        [sequelize_1.Op.in]: this.sequelize.literal(`(${subQuery})`)
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
                let operator = operators[0];
                const arrayMatch = operator.match(/\[(.*)\]/);
                if (arrayMatch && arrayMatch.length > 1) { // sometimes qs doesnt parse the array brackets correct
                    operator = arrayMatch[1];
                }
                const filterValue = value[operators[0]];
                switch (operator) {
                    case ">":
                    case 'gt':
                        return { [sequelize_1.Op.gt]: this.parseValue(filterValue, columnType) };
                    case '<':
                    case 'lt':
                        return { [sequelize_1.Op.lt]: this.parseValue(filterValue, columnType) };
                    case '>=':
                    case 'gte':
                        return { [sequelize_1.Op.gte]: this.parseValue(filterValue, columnType) };
                    case '<=':
                    case 'lte':
                        return { [sequelize_1.Op.lte]: this.parseValue(filterValue, columnType) };
                    case '<>':
                    case 'ne':
                        if (filterValue === 'null') {
                            return { [sequelize_1.Op.not]: null };
                        }
                        return { [sequelize_1.Op.ne]: this.parseValue(filterValue, columnType) };
                    case 'is':
                        if (filterValue === 'null') {
                            return { [sequelize_1.Op.is]: null };
                        }
                        break;
                    case 'not':
                        if (filterValue === 'null') {
                            return { [sequelize_1.Op.not]: null };
                        }
                        break;
                    case '=':
                    case 'eq':
                        if (filterValue === 'null') {
                            return { [sequelize_1.Op.is]: null };
                        }
                        if (Array.isArray(filterValue)) {
                            return { [sequelize_1.Op.in]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [sequelize_1.Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'in':
                        if (Array.isArray(filterValue)) {
                            return { [sequelize_1.Op.in]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        }
                        else if (typeof filterValue === 'object') {
                            return { [sequelize_1.Op.in]: Object.values(filterValue).map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [sequelize_1.Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'notIn':
                        if (Array.isArray(filterValue)) {
                            return { [sequelize_1.Op.notIn]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        }
                        else if (typeof filterValue === 'object') {
                            return { [sequelize_1.Op.notIn]: Object.values(filterValue).map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [sequelize_1.Op.ne]: this.parseValue(filterValue, columnType) };
                    case 'between':
                        return { [sequelize_1.Op.between]: [this.parseValue(filterValue[0], columnType), this.parseValue(filterValue[1], columnType)] };
                    case 'like':
                        return { [sequelize_1.Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                    case 'contains':
                        return { [sequelize_1.Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                    case 'startswith':
                        return { [sequelize_1.Op.like]: `${this.escapeSearchQuery(filterValue)}%` };
                    case 'endswith':
                        return { [sequelize_1.Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                    case 'notcontains':
                        return { [sequelize_1.Op.notLike]: `%${this.escapeSearchQuery(filterValue)}%` };
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
