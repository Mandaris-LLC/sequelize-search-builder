"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
class SummaryBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const summaries = request['totalSummary'];
        return summaries?.reduce((prev, summary) => {
            const name = this.Model.name;
            prev[summary.selector] = {
                field: `${name}.${summary.selector}`,
                function: summary.summaryType,
            };
            return prev;
        }, {});
    }
}
exports.SummaryBuilder = SummaryBuilder;
