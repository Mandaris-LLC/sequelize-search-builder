import { BuilderAbstract } from "./builder-abstract";

export class SummaryBuilder extends BuilderAbstract {
    getQuery() {
        const { request } = this;
        const summaries = request['totalSummary'] as { selector: string, summaryType: 'sum' | 'count' }[]

        return summaries?.reduce((prev, summary) => {
            const name = this.Model.name
            prev[summary.selector] = {
                field: `${typeof name === 'string' ? name : name.tableName}.${summary.selector}`,
                function: summary.summaryType,
            }
            return prev;
        }, {} as { [key: string]: { field: string, function: string } })
    }
}
