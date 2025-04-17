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
        return groups?.map((group) => {
            const name = this.Model.name;
            const { includeMap } = this.extractColumnTypes();
            console.log(includeMap);
            return {
                field: `${name}.${group.selector}`,
                desc: group.desc == 'true' ? true : false,
                isExpanded: group.isExpanded == 'true' ? true : false,
            };
        });
    }
}
exports.GroupBuilder = GroupBuilder;
