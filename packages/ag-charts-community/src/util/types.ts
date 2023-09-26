export type Has<P extends keyof T, T> = T & { [K in P]-?: T[P] };

export type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;

export type Defined<T> = T extends undefined ? never : T;

export type DeepRequired<T> = T extends (...args: any[]) => any
    ? T
    : T extends any[]
    ? _DeepRequiredArray<T[number]>
    : T extends object
    ? _DeepRequiredObject<T>
    : T;

type _DeepRequiredArray<T> = Array<DeepRequired<Defined<T>>>;

type _DeepRequiredObject<T> = {
    [K in keyof T]-?: DeepRequired<Defined<T[K]>>;
};

type DeepPartialDepth = [never, 0, 1, 2, 3, 4, 5, 6]; // DeepPartial recursion limit type.

export type DeepPartial<T, N extends DeepPartialDepth[number] = 5> = [N] extends [never]
    ? Partial<T>
    : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P], DeepPartialDepth[N]> }
    : T;

export type PickRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
