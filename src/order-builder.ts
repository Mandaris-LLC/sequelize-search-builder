import { BuilderAbstract } from "./builder-abstract";

export class OrderBuilder extends BuilderAbstract {
    getQuery() {
        const { request } = this;
        const query: any[] = [];
        const types = this.extractColumnTypes()
        Object.keys(request).forEach((key) => {
            const [topKey] = key.split('.');
            const isJson = types.columnTypes[topKey] === 'JSON';

            const value = isJson
                ? [key, (request[key] as string).trim()]
                : [...key.split('.'), (request[key] as string).trim()];

            query.push(value);
        });

        return query;
    }
}
