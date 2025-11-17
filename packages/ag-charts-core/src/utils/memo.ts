import type { AnyFn } from '../interfaces/globalTypes';

const memorizedFns = new WeakMap<Function, Map<string, any>>();

export function memo<T, R>(params: T, fnGenerator: (params: T) => R): R {
    const serialisedParams = JSON.stringify(params, null, 0);

    if (!memorizedFns.has(fnGenerator)) {
        memorizedFns.set(fnGenerator, new Map());
    }
    if (!memorizedFns.get(fnGenerator)?.has(serialisedParams)) {
        memorizedFns.get(fnGenerator)?.set(serialisedParams, fnGenerator(params));
    }

    return memorizedFns.get(fnGenerator)?.get(serialisedParams) as R;
}

class MemoizeNode {
    weak = new WeakMap<any, MemoizeNode>();
    strong = new Map<any, MemoizeNode>();
    set: boolean = false;
    value: any = undefined;
}

export function simpleMemorize2<F extends AnyFn>(
    fn: F,
    cacheCallback?: (type: 'hit' | 'miss', fn: F, keys: any[]) => void
) {
    let root = new MemoizeNode();

    const memoised = (...p: Parameters<F>) => {
        let current = root;
        for (const param of p) {
            const target = typeof param === 'object' || typeof param === 'symbol' ? current.weak : current.strong;
            let next = target.get(param);
            if (next == null) {
                next = new MemoizeNode();
                target.set(param, next);
            }
            current = next;
        }

        if (current.set) {
            cacheCallback?.('hit', fn, p);
            return current.value;
        } else {
            const out = fn(...p);
            current.set = true;
            current.value = out;
            cacheCallback?.('miss', fn, p);
            return out;
        }
    };

    memoised.reset = () => {
        root = new MemoizeNode();
    };

    return memoised as F & { reset: () => void };
}

export function simpleMemorize<F extends AnyFn>(
    fn: F,
    cacheCallback?: (type: 'hit' | 'miss', fn: F, keys: any[]) => void
) {
    const primitiveCache = new Map<string | number, object>();

    const paramsToKeys = (...params: (WeakKey | string | number | symbol)[]) => {
        return params.map((v) => {
            if (typeof v === 'object') return v;
            if (typeof v === 'symbol') return v;

            if (!primitiveCache.has(v)) {
                primitiveCache.set(v, { v });
            }

            return primitiveCache.get(v)!;
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
        if (cachedValue) {
            cacheCallback?.('hit', fn, p);
        } else {
            cachedValue = fn(...p);
            currentCache.set(finalKey, cachedValue);
            cacheCallback?.('miss', fn, p);
        }

        return cachedValue as ReturnType<F>;
    };
}
