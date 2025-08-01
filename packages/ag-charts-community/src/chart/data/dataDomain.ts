export interface IDataDomain<D = any> {
    extend(val: any): void;
    getDomain(): D[];
}

export class DiscreteDomain implements IDataDomain {
    private readonly domain = new Set();

    static is(value: unknown): value is DiscreteDomain {
        return value instanceof DiscreteDomain;
    }

    extend(val: any) {
        this.domain.add(val);
    }

    getDomain() {
        return Array.from(this.domain);
    }
}

export class ContinuousDomain<T extends number | Date> implements IDataDomain<T> {
    private domain = [Infinity, -Infinity] as [T, T];

    static is<T extends number | Date = any>(value: unknown): value is ContinuousDomain<T> {
        return value instanceof ContinuousDomain;
    }

    static extendDomain(values: unknown[], domain: [number, number] = [Infinity, -Infinity]) {
        for (const value of values) {
            if (typeof value !== 'number') {
                continue;
            }
            if (domain[0] > value) {
                domain[0] = value;
            }
            if (domain[1] < value) {
                domain[1] = value;
            }
        }
        return domain;
    }

    extend(value: T) {
        // TODO: AG-15645 - remove this after patch release
        // if (typeof value !== 'number' && !(value instanceof Date)) {
        //     return;
        // }
        if (this.domain[0] > value) {
            this.domain[0] = value;
        }
        if (this.domain[1] < value) {
            this.domain[1] = value;
        }
    }

    getDomain() {
        return [...this.domain];
    }
}
