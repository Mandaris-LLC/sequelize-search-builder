import { BuilderAbstract, IncludeMap, SeqModelLike } from "./builder-abstract";
import { ParsedQs } from "qs";
export declare class WhereBuilder extends BuilderAbstract {
    private visited;
    constructor(Model: SeqModelLike, request?: ParsedQs, globalRequest?: ParsedQs, config?: any, visited?: Set<string>);
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
