import { BuilderAbstract, SeqModelLike } from "./builder-abstract";
type IncludeMap = {
    [key: string]: any;
};
export declare class WhereBuilder extends BuilderAbstract {
    extractColumnTypes(): {
        columnTypes: {
            [key: string]: string;
        };
        includeMap: IncludeMap;
    };
    getQuery(): {};
    getSubQueryOptions(parentModel: SeqModelLike, key: string, map: IncludeMap, value: any): undefined | {
        col: string;
        filter: any;
    };
    escapeSearchQuery(query: string): string;
    getSearchableColumns(columnTypes: {
        [key: string]: string;
    }): string[];
    getNumberColumns(columnTypes: {
        [key: string]: string;
    }): string[];
    getPotentialUUIDColumns(columnTypes: {
        [key: string]: string;
    }): string[];
    parseFilterValue(value: any, columnType: string): any;
    parseValue(value: any, columnType: string, escape?: boolean): any;
}
export {};
