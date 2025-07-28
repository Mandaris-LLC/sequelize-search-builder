import { BuilderAbstract } from "./builder-abstract";
import { SummaryBuilder } from "./summary-builder";

export class GroupBuilder extends BuilderAbstract {

    getQuery() {
        const { request } = this;
        const groups = request['group'] as { selector: string, desc: 'false' | 'true', isExpanded: 'false' | 'true' }[]
        if (!groups || !Array.isArray(groups)) {
            return undefined
        }
        return {
            summary: new SummaryBuilder(this.Model, this.request, this.globalRequest, this.config).getQuery('groupSummary'),
            groups: groups?.map((group) => {
                const name = this.Model.name

                return {
                    field: group.selector.includes('.') ? group.selector : `${name}.${group.selector}`,
                    desc: group.desc == 'true' ? true : false,
                    isExpanded: group.isExpanded == 'true' ? true : false,
                }
            })
        }
    }

}
