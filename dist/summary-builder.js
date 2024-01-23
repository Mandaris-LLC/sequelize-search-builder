"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
class SummaryBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const summaries = request['totalSummary'];
        return summaries?.reduce((prev, summary) => {
            const name = this.Model.getTableName();
            prev[summary.selector] = {
                field: `${typeof name === 'string' ? name : name.tableName}.${summary.selector}`,
                function: summary.summaryType,
            };
            return prev;
        }, {});
    }
}
exports.SummaryBuilder = SummaryBuilder;
