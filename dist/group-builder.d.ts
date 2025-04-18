import { BuilderAbstract } from "./builder-abstract";
export declare class GroupBuilder extends BuilderAbstract {
    getQuery(): {
        summary: {
            [key: string]: {
                field: string;
                function: string;
            };
        };
        groups: {
            field: string;
            desc: boolean;
            isExpanded: boolean;
        }[];
    } | undefined;
}
