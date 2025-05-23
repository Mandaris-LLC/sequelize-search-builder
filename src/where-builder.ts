import { col, Op, WhereAttributeHashValue } from "sequelize";
import { BuilderAbstract, IncludeMap, SeqModelLike } from "./builder-abstract";
import { findAllQueryAsSQL } from "./sql-generator";
import { ParsedQs } from "qs";


function isNumber(num: string | number) {
    if (typeof num === 'number') {
        return num - num === 0;
    }
    if (typeof num === 'string' && num.trim() !== '') {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
    }
    return false;
};

function foreignKeyInTarget(associationType: string) {
    return associationType === 'HasMany' || associationType === 'HasOne'
}

function isObjectArray(value: any) {
    if (typeof value === 'object') {
        return Object.keys(value).every((v) => isNumber(v))
    }
    return false
}

export class WhereBuilder extends BuilderAbstract {

    getQuery() {
        const { request } = this;
        const query: WhereAttributeHashValue<any> = {};

        const { columnTypes, includeMap } = this.extractColumnTypes();


        for (const [key, value] of Object.entries(request)) {
            if (key === '_q' && value !== '') {
                const searchColumns = this.getSearchableColumns(columnTypes);
                const uuidColumns = this.getPotentialUUIDColumns(columnTypes);
                const numberColumns = this.getNumberColumns(columnTypes);
                query[Op.or] = searchColumns.map<{
                    [x: string]: {
                        [Op.like]?: string;
                        [Op.eq]?: string;
                    };
                }>((column) => ({
                    [column]: {
                        [Op.like]: `%${this.escapeSearchQuery(value as string)}%`
                    },
                })).concat(uuidColumns.map((column) => ({
                    [column]: {
                        [Op.eq]: `${this.escapeSearchQuery(value as string)}`
                    },
                }))).concat((!isNumber(value as string)) ? [] : numberColumns.map((column) => ({
                    [column]: {
                        [Op.eq]: `${value}`
                    },
                })));


                if (this.config["filter-includes"]) {
                    for (const model in includeMap) {
                        if (!includeMap[model].association.through) {
                            const builder = new WhereBuilder(includeMap[model].model, request);
                            if (!foreignKeyInTarget(includeMap[model].association.associationType)) {
                                const subQuery = findAllQueryAsSQL(includeMap[model].model.unscoped(), { where: builder.getQuery(), attributes: ['id'], raw: true })
                                query[Op.or as any].push({
                                    [includeMap[model].association.foreignKey]: {
                                        [Op.in]: this.sequelize.literal(`(${subQuery})`)
                                    }
                                })
                            } else {
                                const subQuery = findAllQueryAsSQL(includeMap[model].model.unscoped(), { where: builder.getQuery(), attributes: [includeMap[model].association.foreignKey], raw: true })
                                query[Op.or as any].push({
                                    [includeMap[model].association.sourceKey]: {
                                        [Op.in]: this.sequelize.literal(`(${subQuery})`)
                                    }
                                })
                            }
                        }
                    }
                }

            } else if (key == 'or' || key == 'and' || key == 'not') {
                const operator: unique symbol = (() => {
                    if (key === 'or') {
                        return Op.or
                    }
                    if (key === 'and') {
                        return Op.and
                    }
                    return Op.not
                })() as any;
                if (Array.isArray(value)) {
                    query[operator] = [];
                    value.forEach((value) => {
                        const builder = new WhereBuilder(this.Model, value as ParsedQs);
                        query[operator].push(builder.getQuery());
                    })
                } else if (isObjectArray(value)) {
                    query[operator] = [];
                    Object.values(value as any).forEach((value) => {
                        const builder = new WhereBuilder(this.Model, value as ParsedQs);
                        query[operator].push(builder.getQuery());
                    })
                } else {
                    const builder = new WhereBuilder(this.Model, value as ParsedQs);
                    query[operator] = builder.getQuery()
                }
            } else {
                const columnType = columnTypes[key];
                if (columnType) {
                    query[key] = this.parseFilterValue(value, columnType);
                } else if (this.config["filter-includes"]) {
                    const result = this.getSubQueryOptions(this.Model, key, includeMap, value)
                    if (result) {
                        query[result.col] = result.filter;
                    }
                }
            }
        }

        return query as {}
    }

    getSubQueryOptions(parentModel: SeqModelLike, key: string, map: IncludeMap, value: any): undefined | { col: string, filter: any } {
        if (!key.includes('.')) {
            return undefined
        }
        const [model, ...rest] = key.split('.')
        if (map[model] && map[model].association.source.tableName == (parentModel as any).tableName) {
            if (rest.length > 1) {
                if (map[model].includeMap) {
                    const subOptions = this.getSubQueryOptions(map[model].model, rest.join('.'), map[model].includeMap, value);
                    if (!subOptions) {
                        return undefined
                    }
                    const attributes = foreignKeyInTarget(map[model].association.associationType) ? [map[model].association.foreignKey] : ['id']
                    const subQuery = findAllQueryAsSQL(map[model].model, {
                        where: {
                            [subOptions.col]: subOptions.filter
                        },
                        attributes: attributes,
                        raw: true
                    })
                    return {
                        col: foreignKeyInTarget(map[model].association.associationType) ? map[model].association.sourceKey : map[model].association.foreignKey,
                        filter: {
                            [Op.in]: this.sequelize.literal(`(${subQuery})`)
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
                            [Op.not]: null
                        }
                    };
                } else if (value['is'] && value['is'] === 'null') {
                    return {
                        col: map[model].association.foreignKey,
                        filter: {
                            [Op.is]: null
                        }
                    };
                }
                if (map[model].association.associationType === 'BelongsToMany') {
                    const builder = new WhereBuilder(map[model].model, { [rest[0]]: value });
                    const attributes = ['id']
                    const subQuery = findAllQueryAsSQL(parentModel, {
                        include: [
                            {
                                model: map[model].model,
                                as: map[model].as,
                                where: builder.getQuery(),
                                required: true
                            }
                        ],
                        attributes: attributes,
                        raw: true
                    })
                    return {
                        col: map[model].association.sourceKey,
                        filter: {
                            [Op.in]: this.sequelize.literal(`(${subQuery})`)
                        }
                    }
                }
                const attributes = foreignKeyInTarget(map[model].association.associationType) ? [map[model].association.foreignKey] : ['id']
                const builder = new WhereBuilder(map[model].model, { [rest[0]]: value });
                const subQuery = findAllQueryAsSQL(map[model].model, { where: builder.getQuery(), attributes: attributes, raw: true })
                return {
                    col: foreignKeyInTarget(map[model].association.associationType) ? map[model].association.sourceKey : map[model].association.foreignKey,
                    filter: {
                        [Op.in]: this.sequelize.literal(`(${subQuery})`)
                    }
                };
            }
        }
    }

    escapeSearchQuery(query: string): string {
        // Escape special characters
        return query.replace(/[%_]/g, '\\$&');
    }

    getSearchableColumns(columnTypes: { [key: string]: string }): string[] {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType === 'STRING')
            .map(([columnName, type]) => columnName);
    }

    getNumberColumns(columnTypes: { [key: string]: string }): string[] {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType === 'NUMBER' || columnType === 'INTEGER' || columnType === 'DECIMAL')
            .map(([columnName, type]) => columnName);
    }

    getPotentialUUIDColumns(columnTypes: { [key: string]: string }): string[] {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType?.startsWith('UUID'))
            .map(([columnName, type]) => columnName);
    }

    parseFilterValue(value: any, columnType: string): any {
        if (typeof value === 'object' && value !== null) {
            const operators = Object.keys(value);
            if (operators.length === 1) {
                let operator = operators[0];
                const arrayMatch = operator.match(/\[(.*)\]/)
                if (arrayMatch && arrayMatch.length > 1) { // sometimes qs doesnt parse the array brackets correct
                    operator = arrayMatch[1]
                }
                const filterValue = value[operators[0]];

                switch (operator) {
                    case ">":
                    case 'gt':
                        return { [Op.gt]: this.parseValue(filterValue, columnType) };
                    case '<':
                    case 'lt':
                        return { [Op.lt]: this.parseValue(filterValue, columnType) };
                    case '>=':
                    case 'gte':
                        return { [Op.gte]: this.parseValue(filterValue, columnType) };
                    case '<=':
                    case 'lte':
                        return { [Op.lte]: this.parseValue(filterValue, columnType) };
                    case '<>':
                    case 'ne':
                        if (filterValue === 'null') {
                            return { [Op.not]: null };
                        }
                        return { [Op.ne]: this.parseValue(filterValue, columnType) };
                    case 'is':
                        if (filterValue === 'null') {
                            return { [Op.is]: null };
                        }
                        break;
                    case 'not':
                        if (filterValue === 'null') {
                            return { [Op.not]: null };
                        }
                        break;
                    case '=':
                    case 'eq':
                        if (filterValue === 'null') {
                            return { [Op.is]: null };
                        }
                        if (Array.isArray(filterValue)) {
                            return { [Op.in]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'in':
                        if (Array.isArray(filterValue)) {
                            return { [Op.in]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        } else if (isObjectArray(filterValue)) {
                            return { [Op.in]: Object.values(filterValue).map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'notIn':
                        if (Array.isArray(filterValue)) {
                            return { [Op.notIn]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        } else if (isObjectArray(filterValue)) {
                            return { [Op.notIn]: Object.values(filterValue).map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [Op.ne]: this.parseValue(filterValue, columnType) };
                    case 'between':
                        return { [Op.between]: [this.parseValue(filterValue[0], columnType), this.parseValue(filterValue[1], columnType)] };
                    case 'like':
                        return { [Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                    case 'contains':
                        return { [Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                    case 'startswith':
                        return { [Op.like]: `${this.escapeSearchQuery(filterValue)}%` };
                    case 'endswith':
                        return { [Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                    case 'notcontains':
                        return { [Op.notLike]: `%${this.escapeSearchQuery(filterValue)}%` };
                }
            }
        }
        return this.parseValue(value, columnType);
    }

    parseValue(value: any, columnType: string, escape = false): any {
        if (typeof value === 'string' && value.startsWith('$.')) {
            return col(value.substring(2))
        }
        if (columnType === 'BOOLEAN') {
            return value === 'true';
        } else if (columnType === 'INTEGER' || columnType === 'FLOAT') {
            return Number(value);
        } else if (columnType === 'STRING') {
            return escape ? this.sequelize.escape(value) : value;
        } else if (columnType === 'DATE') {
            return new Date(value)
        } else {
            // Handle other column types as needed
            return escape ? this.sequelize.escape(value) : value;
        }
    }
}