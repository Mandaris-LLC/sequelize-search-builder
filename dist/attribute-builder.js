"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttributeBuilder = void 0;
const builder_abstract_1 = require("./builder-abstract");
class AttributeBuilder extends builder_abstract_1.BuilderAbstract {
    getAttributes() {
        const { request } = this;
        const dataFields = request['dataField'];
        return dataFields;
    }
}
exports.AttributeBuilder = AttributeBuilder;
