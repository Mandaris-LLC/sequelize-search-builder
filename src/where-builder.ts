import { Op } from "sequelize";
import { BuilderAbstract } from "./builder-abstract";
import { SearchBuilder } from "./search-builder";
import { findAllQueryAsSQL } from "./sql-generator";

type IncludeMap = { [key: string]: any }

export class WhereBuilder extends BuilderAbstract {

    extractColumnTypes(): { columnTypes: { [key: string]: string }, includeMap: IncludeMap } {
        const columnTypes: { [key: string]: string } = {};

        let options = {} as any;
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
            columnTypes[attributeName] = (attribute.type as any).key;
        }

        const includeMap = options.includeMap
        return { columnTypes, includeMap };
    }

    getQuery() {
        const { request } = this;
        const query: { [key: string]: any } = {};

        const { columnTypes, includeMap } = this.extractColumnTypes();


        for (const [key, value] of Object.entries(request)) {
            if (key === '_q' && value !== '') {
                const numberVal = parseInt(value as string)
                const searchColumns = this.getSearchableColumns(columnTypes);
                const uuidColumns = this.getPotentialUUIDColumns(columnTypes);
                const numberColumns = this.getNumberColumns(columnTypes);
                query[Op.or as any] = searchColumns.map((column) => ({
                    [column]: { [Op.like]: `%${this.escapeSearchQuery(value as string)}%` },
                })).concat(uuidColumns.map((column) => ({
                    [column]: { [Op.eq]: `${this.escapeSearchQuery(value as string)}` },
                }))).concat(Number.isNaN(numberVal) ? [] : numberColumns.map((column) => ({
                    [column]: { [Op.eq]: `${parseInt(value as string)}` },
                })));
            }
            const columnType = columnTypes[key];
            if (columnType) {
                query[key] = this.parseFilterValue(value, columnType);
            } else if (this.config["filter-includes"]) {
                const result = this.applySubQuery(key, includeMap, value)
                if (result) {
                    query[result.col] = result.filter;
                }
            }
        }

        return query as {}
    }

    applySubQuery(key: string, map: IncludeMap, value: any): undefined | { col: string, filter: any } {
        if (!key.includes('.')) {
            return undefined
        }
        const [model, ...rest] = key.split('.')
        if (map[model] && map[model].association.source.tableName == (this.Model as any).tableName) {
            if (rest.length > 1) {
                if (map[model].includeMap)
                    return this.applySubQuery(rest.join('.'), map[model].includeMap, value);
                return undefined;
            }
            else {
                const builder = new WhereBuilder(map[model].model, { [rest[0]]: value });
                const subQuery = findAllQueryAsSQL(map[model].model, { where: builder.getQuery(), attributes: ['id'] })
                return {
                    col: map[model].association.foreignKey,
                    filter: {
                        [Op.in]: `(${subQuery})`
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
                const operator = operators[0];
                const filterValue = value[operator];

                switch (operator) {
                    case 'gt':
                        return { [Op.gt]: this.parseValue(filterValue, columnType) };
                    case 'lt':
                        return { [Op.lt]: this.parseValue(filterValue, columnType) };
                    case 'gte':
                        return { [Op.gte]: this.parseValue(filterValue, columnType) };
                    case 'lte':
                        return { [Op.lte]: this.parseValue(filterValue, columnType) };
                    case 'ne':
                        return { [Op.ne]: this.parseValue(filterValue, columnType) };
                    case 'eq':
                        return { [Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'in':
                        if (Array.isArray(filterValue)) {
                            return { [Op.in]: filterValue.map((value) => this.parseValue(value, columnType)) };
                        }
                        return { [Op.eq]: this.parseValue(filterValue, columnType) };
                    case 'between':
                        return { [Op.between]: [this.parseValue(filterValue[0], columnType), this.parseValue(filterValue[1], columnType)] };
                    case 'like':
                        return { [Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                    case 'contains':
                        return { [Op.like]: `%${this.escapeSearchQuery(filterValue)}%` };
                }
            }
        }

        return this.parseValue(value, columnType);
    }

    parseValue(value: any, columnType: string, escape = false): any {
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