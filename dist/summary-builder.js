"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
class SummaryBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const summaries = request['totalSummary'];
        return summaries?.reduce((prev, summary) => {
            prev[summary.selector] = {
                attributes: [[this.sequelize.fn(summary.summaryType, this.sequelize.col(summary.selector)), `summary_${summary.selector}`]]
            };
            return prev;
        }, {});
    }
}
exports.SummaryBuilder = SummaryBuilder;
