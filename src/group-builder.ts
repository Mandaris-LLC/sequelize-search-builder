import { BuilderAbstract } from "./builder-abstract";

export class GroupBuilder extends BuilderAbstract {

    getQuery() {
        const { request } = this;
        const groups = request['group'] as { selector: string, desc: 'false' | 'true', isExapnded: 'false' | 'true' }[]
        if (!Array.isArray(groups)) {
            return undefined
        }
        return groups?.reduce((prev, summary) => {
            const name = this.Model.name
            prev[summary.selector] = {
                field: `${name}.${summary.selector}`,
                desc: summary.desc == 'true' ? true : false,
                isExapnded: summary.isExapnded == 'true' ? true : false,
            }
            return prev;
        }, {} as { [key: string]: { field: string, desc: boolean, isExapnded: boolean } })
    }

}
