import { BuilderAbstract } from "./builder-abstract";

export class SummaryBuilder extends BuilderAbstract {

    getQuery(key = 'totalSummary') {
        const { request } = this;
        const summaries = request[key] as { selector: string, summaryType: 'sum' | 'count' }[]

        return summaries?.reduce((prev, summary) => {
            const name = this.Model.name
            prev[summary.selector] = {
                field: `${name}.${summary.selector}`,
                function: summary.summaryType,
            }
            return prev;
        }, {} as { [key: string]: { field: string, function: string } }) || {}
    }

}
