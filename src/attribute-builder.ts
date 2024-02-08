import { BuilderAbstract } from "./builder-abstract";

export class AttributeBuilder extends BuilderAbstract {

    getAttributes() {
        const { request } = this;
        const dataFields = request['dataField'] as string[] | undefined
        const normalized = dataFields ? Array.isArray(dataFields) ? dataFields : [dataFields] : undefined
        return normalized
    }
}
