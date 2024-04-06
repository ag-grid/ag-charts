export interface IDataProcessor {
    process(value: any, index: number): void;
    getResult(): any;
}

export interface ContinuousProcessorOptions {
    min?: number;
    max?: number;
    nice?: boolean;
    reverse?: boolean;
}

export interface DiscreteProcessorOptions {
    align?: number;
    padding?: number;
    paddingInner?: number;
    paddingOuter?: number;
}

export interface LogProcessorOptions extends ContinuousProcessorOptions {
    base?: number;
}

abstract class DataProcessor<T> implements IDataProcessor {
    constructor(protected options?: T) {}

    abstract process(value: any, index: number): void;
    abstract getResult(): any;
}

abstract class ContinuousProcessor<
    T extends number | Date,
    Options extends ContinuousProcessorOptions = ContinuousProcessorOptions,
> extends DataProcessor<Options> {
    protected readonly domain: [T | number, T | number] = [Infinity, -Infinity];
    protected readonly values: T[] = [];

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

abstract class DiscreteProcessor<
    T,
    Options extends DiscreteProcessorOptions = DiscreteProcessorOptions,
> extends DataProcessor<Options> {
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

export class LogProcessor<T extends number> extends ContinuousProcessor<T> {}
export class NumberProcessor<T extends number> extends ContinuousProcessor<T> {}
export class TimeProcessor<T extends Date> extends ContinuousProcessor<T> {}

export class CategoryProcessor<T> extends DiscreteProcessor<T> {}
