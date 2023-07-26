import { BuilderAbstract } from "./builder-abstract";
export declare class WhereBuilder extends BuilderAbstract {
    extractColumnTypes(): {
        [key: string]: string;
    };
    getQuery(): {};
    escapeSearchQuery(query: string): string;
    getSearchableColumns(columnTypes: {
        [key: string]: string;
    }): string[];
    getPotentialUUIDColumns(columnTypes: {
        [key: string]: string;
    }): string[];
    parseFilterValue(value: any, columnType: string): any;
    parseValue(value: any, columnType: string): any;
}
