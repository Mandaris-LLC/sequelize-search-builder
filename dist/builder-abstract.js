"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderAbstract = void 0;
const qs = require("qs");
const lodash_1 = require("lodash");
const config_1 = require("./config");
class BuilderAbstract {
    constructor(Model, request = {}, config = {}) {
        this.Model = Model;
        if (new.target === BuilderAbstract) {
            throw new TypeError('Cannot construct BuilderAbstract instances directly');
        }
        this.sequelize = Model.sequelize;
        this.request = BuilderAbstract.prepareRequest(request);
        this.config = (0, lodash_1.merge)(config_1.default, config);
    }
    /**
     * Transform request to request object
     * @param {(Object|string)} request
     *
     * @returns {Object}
     */
    static prepareRequest(request = {}) {
        if (typeof request === 'string') {
            return qs.parse(request, { ignoreQueryPrefix: true });
        }
        return request || {};
    }
}
exports.BuilderAbstract = BuilderAbstract;
