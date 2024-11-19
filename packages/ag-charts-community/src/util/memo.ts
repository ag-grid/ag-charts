const memorizedFns = new WeakMap<Function, Map<string, Function>>();

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

export function simpleMemorize<F extends (...args: any[]) => any>(fn: F) {
    const primitveCache = new Map<string | number, object>();

    const paramsToKeys = (...params: (WeakKey | string | number)[]) => {
        return params.map((v) => {
            if (typeof v === 'object') return v;
            if (typeof v === 'symbol') return v;

            if (!primitveCache.has(v)) {
                primitveCache.set(v, { v });
            }

            return primitveCache.get(v)!;
        });
    };

    const empty = {};
    const cache = new WeakMap();

    return (...p: Parameters<F>) => {
        const keys = p.length === 0 ? [empty] : paramsToKeys(...p);

        let currentCache = cache;
        for (const key of keys.slice(0, -1)) {
            if (!currentCache.has(key)) {
                currentCache.set(key, new WeakMap());
            }

            currentCache = currentCache.get(key)!;
        }

        const finalKey = keys.at(-1)!;
        let cachedValue = currentCache.get(finalKey);
        if (!cachedValue) {
            cachedValue = fn(...p);
            currentCache.set(finalKey, cachedValue);
        }

        return cachedValue as ReturnType<F>;
    };
}
