import { BuilderAbstract } from "./builder-abstract";
import { fn } from 'sequelize'

export class SummaryBuilder extends BuilderAbstract {
    getQuery() {
        const { request } = this;
        const query: any[] = [];
        const summaries = request['totalSummary'] as { selector: string, summaryType: 'sum' | 'count' }[]

        return summaries.reduce((prev, summary) => {
            prev[summary.selector] = {
                attributes: [fn(summary.summaryType, summary.selector), `summary_${summary.selector}`]
            }
            return prev;
        }, {} as { [key: string]: { attributes: any } })
    }
}
