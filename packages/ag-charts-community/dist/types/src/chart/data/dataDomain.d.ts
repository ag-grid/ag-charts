export interface IDataDomain<D = any> {
    extend(val: any): void;
    getDomain(): D[];
}
export declare class DiscreteDomain implements IDataDomain {
    private domain;
    static is(value: unknown): value is DiscreteDomain;
    extend(val: any): void;
    getDomain(): unknown[];
}
export declare class ContinuousDomain<T extends number | Date> implements IDataDomain<T> {
    private domain;
    static is<T extends number | Date = any>(value: unknown): value is ContinuousDomain<T>;
    static extendDomain(values: unknown[], domain?: [number, number]): [number, number];
    extend(value: T): void;
    getDomain(): T[];
}
