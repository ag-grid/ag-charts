export declare function memo<T, R>(params: T, fnGenerator: (params: T) => () => R): () => R;
export declare function memoizeFunction<T, R>(baseFn: (params: T, ...rest: unknown[]) => R): (params: T, ...rest: unknown[]) => R;
