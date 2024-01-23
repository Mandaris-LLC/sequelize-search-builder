"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
const sequelize_1 = require("sequelize");
class SummaryBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const summaries = request['totalSummary'];
        return summaries?.reduce((prev, summary) => {
            prev[summary.selector] = {
                attributes: [[(0, sequelize_1.fn)(summary.summaryType, (0, sequelize_1.col)(summary.selector)), `summary_${summary.selector}`]]
            };
            return prev;
        }, {});
    }
}
exports.SummaryBuilder = SummaryBuilder;
