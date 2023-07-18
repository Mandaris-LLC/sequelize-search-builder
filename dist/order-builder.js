"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
class OrderBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const query = [];
        Object.keys(request).forEach((key) => {
            const value = key.split('.');
            value.push(request[key]);
            query.push(value);
        });
        return query;
    }
}
exports.OrderBuilder = OrderBuilder;
