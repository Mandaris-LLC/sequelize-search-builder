"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhereBuilder = void 0;
const sequelize_1 = require("sequelize");
const builder_abstract_1 = require("./builder-abstract");
const sql_generator_1 = require("./sql-generator");
const util_1 = require("./util");
function foreignKeyInTarget(associationType) {
    return associationType === 'HasMany' || associationType === 'HasOne';
}
class WhereBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const query = {};
        const { columnTypes, includeMap } = this.extractColumnTypes();
        const { includeMap: allIncludesMap } = this.extractColumnTypes(true);
        for (const [key, value] of Object.entries(request)) {
            if (key === '_q' && value !== '') {
                const searchColumns = this.getSearchableColumns(columnTypes);
                const uuidColumns = this.getPotentialUUIDColumns(columnTypes);
                const numberColumns = this.getNumberColumns(columnTypes);
                query[sequelize_1.Op.or] = searchColumns.map((column) => ({
                    [column]: {
                        [sequelize_1.Op.like]: `%${this.escapeSearchQuery(value)}%`
                    },
                })).concat(uuidColumns.map((column) => ({
                    [column]: {
                        [sequelize_1.Op.eq]: `${this.escapeSearchQuery(value)}`
                    },
                }))).concat((!(0, util_1.isNumber)(value)) ? [] : numberColumns.map((column) => ({
                    [column]: {
                        [sequelize_1.Op.eq]: `${value}`
                    },
                })));
                if (this.config["filter-includes"]) {
                    for (const model in includeMap) {
                        if (!includeMap[model].association.through) {
                            const globalRequestOptions = {};
                            if (this.globalRequest['searchColumns'] && Array.isArray(this.globalRequest['searchColumns'])) {
                                globalRequestOptions['searchColumns'] = this.globalRequest['searchColumns'].filter((name) => name.startsWith(model)).map((name) => name.split('.').slice(1).join('.'));
                            }
                            const builder = new WhereBuilder(includeMap[model].model, request, globalRequestOptions);
                            if (!foreignKeyInTarget(includeMap[model].association.associationType)) {
                                const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(includeMap[model].model.unscoped(), { where: builder.getQuery(), attributes: ['id'], raw: true });
                                query[sequelize_1.Op.or].push({
                                    [includeMap[model].association.foreignKey]: {
                                        [sequelize_1.Op.in]: this.sequelize.literal(`(${subQuery})`)
                                    }
                                });
                            }
                            else {
                                const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(includeMap[model].model.unscoped(), { where: builder.getQuery(), attributes: [includeMap[model].association.foreignKey], raw: true });
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
            else if (key == 'or' || key == 'and' || key == 'not') {
                const operator = (() => {
                    if (key === 'or') {
                        return sequelize_1.Op.or;
                    }
                    if (key === 'and') {
                        return sequelize_1.Op.and;
                    }
                    return sequelize_1.Op.not;
                })();
                if (Array.isArray(value)) {
                    // Group sub queries by thir inlcude models (like '{"and":[{"intakes.location_id":{"=":"ba7152e4-797d-41e3-a601-03dd25aa8547"}},{"intakes.is_latest":{"=":"true"}}]}')
                    const groupedByInclude = {};
                    const passthrough = [];
                    for (const clause of value) {
                        if (clause && typeof clause === 'object' && key === 'and') {
                            const onlyKey = Object.keys(clause)[0];
                            if (onlyKey && onlyKey.includes('.')) {
                                // ToDo: might need to extend for deeper queries like invoice_items.item.type (only supports one level atm)
                                const parts = onlyKey.split('.');
                                if (parts.length === 2) {
                                    const [alias, leaf] = parts;
                                    groupedByInclude[alias] || (groupedByInclude[alias] = {});
                                    const val = clause[onlyKey];
                                    if (groupedByInclude[alias][leaf] === undefined) {
                                        groupedByInclude[alias][leaf] = [val];
                                    }
                                    else if (Array.isArray(groupedByInclude[alias][leaf])) {
                                        groupedByInclude[alias][leaf].push(val);
                                    }
                                    else {
                                        groupedByInclude[alias][leaf] = [groupedByInclude[alias][leaf], val];
                                    }
                                    continue;
                                }
                            }
                        }
                        // anything else -> fall back to original behavior
                        passthrough.push(clause);
                    }
                    query[operator] = [];
                    function normalizeGroupedLeafMap(leafMap) {
                        const out = {};
                        const orBucket = [];
                        for (const [leaf, raw] of Object.entries(leafMap)) {
                            // not an array -> leave untouched
                            if (!Array.isArray(raw)) {
                                out[leaf] = raw;
                                continue;
                            }
                            // single entry -> keep original operator object (e.g. { "=": "x" })
                            if (raw.length === 1) {
                                out[leaf] = raw[0];
                                continue;
                            }
                            // multiple entries -> if all are "="/eq, collapse to IN; else OR them
                            const allEq = raw.every((cond) => {
                                if (!cond || typeof cond !== 'object')
                                    return false;
                                const ks = Object.keys(cond);
                                return ks.length === 1 && (ks[0] === '=' || ks[0] === 'eq');
                            });
                            if (allEq) {
                                out[leaf] = { in: raw.map((c) => (c['='] ?? c['eq'])) };
                            }
                            else {
                                // keep each original operator by OR-ing them
                                orBucket.push(...raw.map((c) => ({ [leaf]: c })));
                            }
                        }
                        if (orBucket.length) {
                            const existingOr = out['or'];
                            out['or'] = Array.isArray(existingOr) ? existingOr.concat(orBucket) : orBucket;
                        }
                        return out;
                    }
                    // Create a single subquery per include alias
                    for (const [alias, leafMap] of Object.entries(groupedByInclude)) {
                        const inc = allIncludesMap[alias];
                        if (!inc) {
                            // fallback
                            const b = new WhereBuilder(this.Model, { [alias]: leafMap }, this.globalRequest);
                            query[operator].push(b.getQuery());
                            continue;
                        }
                        const mergedLeafMap = normalizeGroupedLeafMap(leafMap);
                        const childBuilder = new WhereBuilder(inc.model, mergedLeafMap, this.globalRequest);
                        const attrs = foreignKeyInTarget(inc.association.associationType)
                            ? [inc.association.foreignKey]
                            : ['id'];
                        const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(inc.model.unscoped(), { where: childBuilder.getQuery(), attributes: attrs, raw: true });
                        query[operator].push({
                            [foreignKeyInTarget(inc.association.associationType)
                                ? inc.association.sourceKey
                                : inc.association.foreignKey]: {
                                [sequelize_1.Op.in]: this.sequelize.literal(`(${subQuery})`),
                            },
                        });
                    }
                    // leftover clauses
                    for (const clause of passthrough) {
                        const b = new WhereBuilder(this.Model, clause, this.globalRequest);
                        query[operator].push(b.getQuery());
                    }
                }
                else if ((0, util_1.isObjectArray)(value)) {
                    query[operator] = [];
                    Object.values(value).forEach((v) => {
                        const b = new WhereBuilder(this.Model, v, this.globalRequest);
                        query[operator].push(b.getQuery());
                    });
                }
                else {
                    const b = new WhereBuilder(this.Model, value, this.globalRequest);
                    query[operator] = b.getQuery();
                }
            }
            else {
                const columnType = columnTypes[key];
                if (columnType) {
                    query[key] = this.parseFilterValue(value, columnType);
                }
                else if (this.config["filter-includes"]) {
                    const result = this.getSubQueryOptions(this.Model, key, allIncludesMap, value);
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
                    const attributes = foreignKeyInTarget(map[model].association.associationType) ? [map[model].association.foreignKey] : ['id'];
                    const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(map[model].model.unscoped(), {
                        where: {
                            [subOptions.col]: subOptions.filter
                        },
                        attributes: attributes,
                        raw: true
                    });
                    return {
                        col: foreignKeyInTarget(map[model].association.associationType) ? map[model].association.sourceKey : map[model].association.foreignKey,
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
                if (map[model].association.associationType === 'BelongsToMany') {
                    const builder = new WhereBuilder(map[model].model, { [rest[0]]: value }, this.globalRequest);
                    const attributes = ['id'];
                    const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(parentModel, {
                        include: [
                            {
                                model: map[model].model.unscoped(),
                                as: map[model].as,
                                where: builder.getQuery(),
                                required: true
                            }
                        ],
                        attributes: attributes,
                        raw: true
                    });
                    return {
                        col: map[model].association.sourceKey,
                        filter: {
                            [sequelize_1.Op.in]: this.sequelize.literal(`(${subQuery})`)
                        }
                    };
                }
                const attributes = foreignKeyInTarget(map[model].association.associationType) ? [map[model].association.foreignKey] : ['id'];
                const builder = new WhereBuilder(map[model].model.unscoped(), { [rest[0]]: value }, this.globalRequest);
                const subQuery = (0, sql_generator_1.findAllQueryAsSQL)(map[model].model.unscoped(), { where: builder.getQuery(), attributes: attributes, raw: true });
                return {
                    col: foreignKeyInTarget(map[model].association.associationType) ? map[model].association.sourceKey : map[model].association.foreignKey,
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
            .map(([columnName, type]) => columnName).filter((name) => {
            if (this.globalRequest['searchColumns'] && Array.isArray(this.globalRequest['searchColumns'])) {
                return this.globalRequest.searchColumns.includes(name);
            }
            return true;
        });
    }
    getNumberColumns(columnTypes) {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType === 'NUMBER' || columnType === 'INTEGER' || columnType === 'DECIMAL')
            .map(([columnName, type]) => columnName).filter((name) => {
            if (this.globalRequest['searchColumns'] && Array.isArray(this.globalRequest['searchColumns'])) {
                return this.globalRequest.searchColumns.includes(name);
            }
            return true;
        });
    }
    getPotentialUUIDColumns(columnTypes) {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType?.startsWith('UUID') || columnType?.startsWith('CHAR(36)'))
            .map(([columnName, type]) => columnName).filter((name) => {
            if (this.globalRequest['searchColumns'] && Array.isArray(this.globalRequest['searchColumns'])) {
                return this.globalRequest.searchColumns.includes(name);
            }
            return true;
        });
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
                        else if ((0, util_1.isObjectArray)(filterValue)) {
                            return { [sequelize_1.Op.in]: Object.values(filterValue).map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [sequelize_1.Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'notIn':
                        if (Array.isArray(filterValue)) {
                            return { [sequelize_1.Op.notIn]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        }
                        else if ((0, util_1.isObjectArray)(filterValue)) {
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
        if (typeof value === 'string' && value.startsWith('$.')) {
            return (0, sequelize_1.col)(value.substring(2));
        }
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
