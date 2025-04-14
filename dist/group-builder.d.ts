import { BuilderAbstract } from "./builder-abstract";
export declare class GroupBuilder extends BuilderAbstract {
    getQuery(): {
        [key: string]: {
            field: string;
            desc: boolean;
            isExapnded: boolean;
        };
    } | undefined;
}
