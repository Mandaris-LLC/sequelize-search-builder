"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const defaultConfig = {
    logging: false,
    fields: {
        filter: 'filter',
        order: 'order',
        limit: 'limit',
        offset: 'offset',
    },
    'filter-includes': false,
    'default-limit': 10,
};
exports.config = defaultConfig;
exports.default = exports.config;
