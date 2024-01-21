
const defaultConfig = {
    logging: false,

    fields: {
        filter: 'filter',
        order: 'order',
        limit: 'limit',
        offset: 'offset',
        loadingAll: 'isLoadingAll'
    },

    'filter-includes': false,

    'default-limit': 10,
};

export type Config = typeof defaultConfig

export const config = defaultConfig
export default config