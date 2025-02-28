import { Logger } from 'ag-charts-core';

type Caller = { context?: unknown };
type AnyFn = (...args: any[]) => any;

function needsContext<I>(caller: Caller, _params: I[]): _params is (I & { context: unknown })[] {
    return 'context' in caller;
}

export function callWithContext<F extends AnyFn>(caller: Caller, fn: F, params: Parameters<F>): ReturnType<F> {
    if (needsContext(caller, params)) {
        if (params[0] != null && typeof params[0] === 'object') {
            params[0].context = caller.context;
        }
    }
    return fn(...params);
}

export class CallbackCache {
    private cache: WeakMap<Function, Map<string, any>> = new WeakMap();

    call<F extends AnyFn>(caller: Caller, fn: F, ...params: Parameters<F>): ReturnType<F> | undefined {
        let serialisedParams: string;
        let paramCache = this.cache.get(fn);

        try {
            serialisedParams = JSON.stringify(params);
        } catch {
            // Unable to serialise params!
            // No caching possible.

            return this.invoke(caller, fn, params, paramCache);
        }

        if (paramCache == null) {
            paramCache = new Map();
            this.cache.set(fn, paramCache);
        }

        if (!paramCache.has(serialisedParams)) {
            return this.invoke(caller, fn, params, paramCache, serialisedParams);
        }

        return paramCache.get(serialisedParams);
    }

    private invoke<F extends AnyFn>(
        caller: Caller,
        fn: F,
        params: Parameters<F>,
        paramCache?: Map<string, any>,
        serialisedParams?: string
    ) {
        try {
            const result = callWithContext(caller, fn, params);
            if (paramCache && serialisedParams != null) {
                paramCache.set(serialisedParams, result);
            }
            return result;
        } catch (e) {
            Logger.warnOnce(`User callback errored, ignoring`, e);
            return;
        }
    }

    invalidateCache() {
        this.cache = new WeakMap();
    }
}
