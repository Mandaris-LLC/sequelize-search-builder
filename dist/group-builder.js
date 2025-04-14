"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
class GroupBuilder extends builder_abstract_1.BuilderAbstract {
    getQuery() {
        const { request } = this;
        const groups = request['group'];
        if (!Array.isArray(groups)) {
            return undefined;
        }
        return groups?.reduce((prev, summary) => {
            const name = this.Model.name;
            prev[summary.selector] = {
                field: `${name}.${summary.selector}`,
                desc: summary.desc == 'true' ? true : false,
                isExapnded: summary.isExapnded == 'true' ? true : false,
            };
            return prev;
        }, {});
    }
}
exports.GroupBuilder = GroupBuilder;
