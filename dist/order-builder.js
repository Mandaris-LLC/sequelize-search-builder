"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
class OrderBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const query = [];
        const { columnTypes } = this.getColumnTypes();
        Object.keys(request).forEach((key) => {
            const [topKey] = key.split('.');
            const isJson = columnTypes[topKey] === 'JSON';
            const value = isJson
                ? [key, request[key].trim()]
                : [...key.split('.'), request[key].trim()];
            query.push(value);
        });
        return query;
    }
}
exports.OrderBuilder = OrderBuilder;
