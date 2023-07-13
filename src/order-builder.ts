import { BuilderAbstract } from "./builder-abstract";

export class OrderBuilder extends BuilderAbstract {
    getQuery() {
        const { request } = this;
        const query: any[] = [];

        Object.keys(request).forEach((key) => {
            const value = key.split('.');
            value.push(request[key] as string);
            query.push(value);
        });

        return query;
    }
}
