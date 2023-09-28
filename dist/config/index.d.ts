declare const defaultConfig: {
    logging: boolean;
    fields: {
        filter: string;
        order: string;
        limit: string;
        offset: string;
    };
    'filter-includes': boolean;
    'default-limit': number;
};
export type Config = typeof defaultConfig;
export declare const config: {
    logging: boolean;
    fields: {
        filter: string;
        order: string;
        limit: string;
        offset: string;
    };
    'filter-includes': boolean;
    'default-limit': number;
};
export default config;
