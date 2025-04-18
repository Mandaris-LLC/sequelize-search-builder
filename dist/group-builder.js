"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
const summary_builder_1 = require("./summary-builder");
class GroupBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const groups = request['group'];
        if (!Array.isArray(groups)) {
            return undefined;
        }
        return {
            summary: new summary_builder_1.SummaryBuilder(this.Model, this.request, this.config).getQuery('groupSummary'),
            groups: groups?.map((group) => {
                const name = this.Model.name;
                return {
                    field: group.selector.includes('.') ? group.selector : `${name}.${group.selector}`,
                    desc: group.desc == 'true' ? true : false,
                    isExpanded: group.isExpanded == 'true' ? true : false,
                };
            })
        };
    }
}
exports.GroupBuilder = GroupBuilder;
