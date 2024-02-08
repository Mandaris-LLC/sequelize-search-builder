import { defaults } from 'lodash';
import { FindOptions, QueryTypes, Utils } from 'sequelize';

function removeAttributesFromIncludes(options: FindOptions<any>) {
    if (options.include) {
        if (Array.isArray(options.include)) {
            options.include.forEach((subModel: any) => {
                subModel.attributes = []
                if (subModel.include) {
                    removeAttributesFromIncludes(subModel)
                }
            })
        } else {
        }
    }
}

export function findAllQueryAsSQL(SeqModel: any, _options: FindOptions<any>) {
    let options = _options as any;
    const tableNames: any = {};

    tableNames[SeqModel.getTableName(options) as any] = true;
    options = Utils.cloneDeep(options);

    defaults(options, { hooks: true, rejectOnEmpty: SeqModel.options.rejectOnEmpty });

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
    } else {
        removeAttributesFromIncludes(options);
    }

    // whereCollection is used for non-primary key updates
    SeqModel.options.whereCollection = options.where || null;

    (Utils as any).mapFinderOptions(options, SeqModel);

    options = SeqModel._paranoidClause(SeqModel, options);

    options.tableNames = Object.keys(tableNames);

    options.type = QueryTypes.SELECT;
    options.model = SeqModel;
    return (SeqModel.sequelize.queryInterface.queryGenerator.selectQuery(SeqModel.getTableName(options), options, SeqModel) as string).slice(0, -1);
}
