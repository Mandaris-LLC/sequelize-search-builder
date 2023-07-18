"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhereBuilder = void 0;
const sequelize_1 = require("sequelize");
const builder_abstract_1 = require("./builder-abstract");
class WhereBuilder extends builder_abstract_1.BuilderAbstract {
    extractColumnTypes() {
        const columnTypes = {};
        for (const [attributeName, attribute] of Object.entries(this.Model.rawAttributes)) {
            columnTypes[attributeName] = attribute.type.key;
        }
        return columnTypes;
    }
    getQuery() {
        const { request } = this;
        const query = {};
        const columnTypes = this.extractColumnTypes();
        for (const [key, value] of Object.entries(request)) {
            if (key === '_q') {
                const searchColumns = this.getSearchableColumns(columnTypes);
                query[sequelize_1.Op.or] = searchColumns.map((column) => ({
                    [column]: { [sequelize_1.Op.like]: `%${this.escapeSearchQuery(value)}%` },
                }));
            }
            const columnType = columnTypes[key];
            if (columnType)
                query[key] = this.parseFilterValue(value, columnType);
        }
        return query;
    }
    escapeSearchQuery(query) {
        // Escape special characters
        return query.replace(/[%_]/g, '\\$&');
    }
    getSearchableColumns(columnTypes) {
        return Object.entries(columnTypes)
            .filter(([_, columnType]) => columnType === 'STRING')
            .map(([columnName, _]) => columnName);
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
                    case 'between':
                        return { [sequelize_1.Op.between]: [this.parseValue(filterValue[0], columnType), this.parseValue(filterValue[1], columnType)] };
                    case 'like':
                        return { [sequelize_1.Op.like]: `%${this.parseValue(filterValue, columnType)}%` };
                }
            }
        }
        return this.parseValue(value, columnType);
    }
    parseValue(value, columnType) {
        if (columnType === 'BOOLEAN') {
            return value === 'true';
        }
        else if (columnType === 'INTEGER' || columnType === 'FLOAT') {
            return Number(value);
        }
        else if (columnType === 'STRING') {
            return this.sequelize.escape(value);
        }
        else if (columnType === 'DATE') {
            return new Date(value);
        }
        else {
            // Handle other column types as needed
            return this.sequelize.escape(value);
        }
    }
}
exports.WhereBuilder = WhereBuilder;
