import { BuilderAbstract } from "./builder-abstract";
export declare class SummaryBuilder extends BuilderAbstract {
    getQuery(key?: string): {
        [key: string]: {
            field: string;
            function: string;
        };
    };
}
