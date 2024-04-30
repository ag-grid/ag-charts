export declare function extent(values: Array<number | Date>): [number, number] | undefined;
export declare function normalisedExtent(d: number[], min: number, max: number): number[];
export declare function normalisedExtentWithMetadata(d: number[], min: number, max: number): {
    extent: number[];
    clipped: boolean;
};
export declare function arraysEqual(a: any[], b: any[]): boolean;
export declare function toArray<T>(value: T | T[] | undefined): T[];
export declare function unique<T>(array: T[]): T[];
export declare function groupBy<T, R extends string | number | symbol>(array: T[], iteratee: (item: T) => R): { [K in R]?: T[] | undefined; };
export declare function circularSliceArray<T>(data: T[], size: number, offset?: number): T[];
export declare function bifurcate<T>(isLeft: (array: T) => boolean, array: T[]): [T[], T[]];
export declare function mapIterable<Src, Dst>(src: Iterable<Src>, predicate: (e: Src) => Dst): Iterable<Dst>;
export declare function allInStringUnion<T extends string>(unionValues: readonly T[], values: string[]): values is T[];
