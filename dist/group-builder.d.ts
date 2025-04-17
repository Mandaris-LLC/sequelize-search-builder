import { BuilderAbstract } from "./builder-abstract";
export declare class GroupBuilder extends BuilderAbstract {
    getQuery(): {
        field: string;
        desc: boolean;
        isExpanded: boolean;
    }[] | undefined;
}
