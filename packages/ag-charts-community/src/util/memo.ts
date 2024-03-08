const memorizedFns = new WeakMap<Function, Map<string, Function>>();
const memorizedMap = new WeakMap<Function, Map<string, unknown>>();

export function memo<T, R>(params: T, fnGenerator: (params: T) => () => R): () => R {
    const serialisedParams = JSON.stringify(params, null, 0);

    if (!memorizedFns.has(fnGenerator)) {
        memorizedFns.set(fnGenerator, new Map());
    }
    if (!memorizedFns.get(fnGenerator)?.has(serialisedParams)) {
        memorizedFns.get(fnGenerator)?.set(serialisedParams, fnGenerator(params));
    }

    return memorizedFns.get(fnGenerator)?.get(serialisedParams) as () => R;
}

export function memoizeFunction<T, R>(baseFn: (params: T, ...rest: unknown[]) => R) {
    return (params: T, ...rest: unknown[]) => {
        const serialisedParams = JSON.stringify(params, null, 0);

        if (!memorizedMap.has(baseFn)) {
            memorizedMap.set(baseFn, new Map());
        }
        if (!memorizedMap.get(baseFn)?.has(serialisedParams)) {
            memorizedMap.get(baseFn)?.set(serialisedParams, baseFn(params, ...rest));
        }

        return memorizedMap.get(baseFn)?.get(serialisedParams) as R;
    };
}
