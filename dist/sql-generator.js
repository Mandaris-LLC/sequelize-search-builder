"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllQueryAsSQL = void 0;
const lodash_1 = require("lodash");
const sequelize_1 = require("sequelize");
function findAllQueryAsSQL(SeqModel, _options) {
    let options = _options;
    const tableNames = {};
    tableNames[SeqModel.getTableName(options)] = true;
    options = sequelize_1.Utils.cloneDeep(options);
    (0, lodash_1.defaults)(options, { hooks: true, rejectOnEmpty: SeqModel.options.rejectOnEmpty });
    // set rejectOnEmpty option from model config
    options.rejectOnEmpty = options.rejectOnEmpty || SeqModel.options.rejectOnEmpty;
    SeqModel._injectScope(options);
    SeqModel._conformIncludes(options, SeqModel);
    SeqModel._expandAttributes(options);
    SeqModel._expandIncludeAll(options);
    if (options.include) {
        options.hasJoin = true;
        SeqModel._validateIncludedElements(options, tableNames);
        // If we're not raw, we have to make sure we include the primary key for deduplication
        if (options.attributes && !options.raw && SeqModel.primaryKeyAttribute && options.attributes.indexOf(SeqModel.primaryKeyAttribute) === -1) {
            options.originalAttributes = options.attributes;
            if (!options.group || !options.hasSingleAssociation || options.hasMultiAssociation) {
                options.attributes = [SeqModel.primaryKeyAttribute].concat(options.attributes);
            }
        }
    }
    if (!options.attributes) {
        options.attributes = Object.keys(SeqModel.tableAttributes);
    }
    // whereCollection is used for non-primary key updates
    SeqModel.options.whereCollection = options.where || null;
    sequelize_1.Utils.mapFinderOptions(options, SeqModel);
    options = SeqModel._paranoidClause(SeqModel, options);
    options.tableNames = Object.keys(tableNames);
    options.type = sequelize_1.QueryTypes.SELECT;
    options.model = SeqModel;
    return SeqModel.sequelize.queryInterface.queryGenerator.selectQuery(SeqModel.getTableName(options), options, SeqModel).slice(0, -1);
}
exports.findAllQueryAsSQL = findAllQueryAsSQL;
