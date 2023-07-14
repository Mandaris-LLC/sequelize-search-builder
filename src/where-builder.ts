import { AbstractDataTypeConstructor, Op } from "sequelize";
import { BuilderAbstract } from "./builder-abstract";


export class WhereBuilder extends BuilderAbstract {

    extractColumnTypes(): { [key: string]: string } {
        const columnTypes: { [key: string]: string } = {};

        for (const [attributeName, attribute] of Object.entries(this.Model.rawAttributes)) {
            columnTypes[attributeName] = (attribute.type as AbstractDataTypeConstructor).key;
        }

        return columnTypes;
    }

    getQuery() {
        const { request } = this;
        const query: { [key: string]: any } = {};

        const columnTypes = this.extractColumnTypes();


        for (const [key, value] of Object.entries(request)) {
            if (key === '_q') {
                const searchColumns = this.getSearchableColumns(columnTypes);
                query[Op.or as any] = searchColumns.map((column) => ({
                    [column]: { [Op.like]: `%${this.escapeSearchQuery(value as string)}%` },
                }));
            }
            const columnType = columnTypes[key];
            if (columnType)
                query[key] = this.parseFilterValue(value, columnType);
        }

        return query as {}
    }

    escapeSearchQuery(query: string): string {
        // Escape special characters
        return query.replace(/[%_]/g, '\\$&');
    }

    getSearchableColumns(columnTypes: { [key: string]: string }): string[] {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType === 'STRING')
            .map(([columnName, _]) => columnName);
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
                    case 'between':
                        return { [Op.between]: [this.parseValue(filterValue[0], columnType), this.parseValue(filterValue[1], columnType)] };
                    case 'like':
                        return { [Op.like]: `%${this.parseValue(filterValue, columnType)}%` };
                }
            }
        }

        return this.parseValue(value, columnType);
    }

    parseValue(value: any, columnType: string): any {
        if (columnType === 'BOOLEAN') {
            return value === 'true';
        } else if (columnType === 'INTEGER' || columnType === 'FLOAT') {
            return Number(value);
        } else if (columnType === 'STRING') {
            return this.sequelize.escape(value);
        } else if (columnType === 'DATE') {
            return new Date(value)
        } else {
            // Handle other column types as needed
            return this.sequelize.escape(value);
        }
    }
}