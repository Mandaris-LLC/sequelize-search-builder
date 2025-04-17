import { BuilderAbstract } from "./builder-abstract";

export class GroupBuilder extends BuilderAbstract {

    getQuery() {
        const { request } = this;
        const groups = request['group'] as { selector: string, desc: 'false' | 'true', isExpanded: 'false' | 'true' }[]
        if (!Array.isArray(groups)) {
            return undefined
        }
        return groups?.map((group) => {
            const name = this.Model.name
            return {
                field: `${name}.${group.selector}`,
                desc: group.desc == 'true' ? true : false,
                isExpanded: group.isExpanded == 'true' ? true : false,
            }
        })
    }

}
