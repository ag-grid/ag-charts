export interface IDataProcessor {
    process(value: any, index: number): void;
    getResult(): any;
}

class ContinuousProcessor<T extends number | Date> implements IDataProcessor {
    readonly domain: [T | number, T | number] = [Infinity, -Infinity];
    readonly values: T[] = [];

    process(value: T) {
        this.values.push(value);
        if (this.domain[0] > value) {
            this.domain[0] = value;
        }
        if (this.domain[1] < value) {
            this.domain[1] = value;
        }
    }

    getResult() {
        return { domain: this.domain, values: this.values };
    }
}

export class NumberProcessor<T extends number> extends ContinuousProcessor<T> {}
export class TimeProcessor<T extends Date> extends ContinuousProcessor<T> {}

class DiscreteProcessor<T> implements IDataProcessor {
    readonly domain = new Set<T>();
    readonly values: T[] = [];

    process(value: T) {
        this.domain.add(value);
        this.values.push(value);
    }

    getResult() {
        return { domain: this.domain, values: this.values };
    }
}

export class CategoryProcessor<T> extends DiscreteProcessor<T> {}
