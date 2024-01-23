import { BuilderAbstract } from "./builder-abstract";
import { fn, col } from 'sequelize'

export class SummaryBuilder extends BuilderAbstract {
    getQuery() {
        const { request } = this;
        const summaries = request['totalSummary'] as { selector: string, summaryType: 'sum' | 'count' }[]

        return summaries?.reduce((prev, summary) => {
            prev[summary.selector] = {
                attributes: [[fn(summary.summaryType, col(summary.selector)), `summary_${summary.selector}`]]
            }
            return prev;
        }, {} as { [key: string]: { attributes: any } })
    }
}
