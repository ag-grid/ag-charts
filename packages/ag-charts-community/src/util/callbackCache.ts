import { type AnyFn, Logger } from 'ag-charts-core';

type Caller = { context?: unknown } | undefined;

function needsContext<I>(caller: NonNullable<Caller>, _params: I[]): _params is (I & { context: unknown })[] {
    return 'context' in caller;
}
function maybeSetContext<I>(caller: Caller, params: I[]): boolean {
    if (caller != null && needsContext(caller, params)) {
        if (params[0] != null && typeof params[0] === 'object' && params[0].context === undefined) {
            params[0].context = caller.context;
            return true;
        }
    }
    return false;
}
export function callWithContext<F extends AnyFn>(
    callers: Caller | Caller[],
    fn: F,
    ...params: Parameters<F>
): ReturnType<F> {
    if (Array.isArray(callers)) {
        for (const caller of callers) {
            if (maybeSetContext(caller, params)) {
                break;
            }
        }
    } else {
        maybeSetContext(callers, params);
    }
    return fn(...params);
}

export class CallbackCache {
    private cache: WeakMap<Function, Map<string, any>> = new WeakMap();

    call<F extends AnyFn>(callers: Caller | Caller[], fn: F, ...params: Parameters<F>): ReturnType<F> | undefined {
        let serialisedParams: string;
        let paramCache = this.cache.get(fn);

        try {
            serialisedParams = JSON.stringify(params);
        } catch {
            // Unable to serialise params!
            // No caching possible.

            return this.invoke(callers, fn, paramCache, undefined, ...params);
        }

        if (paramCache == null) {
            paramCache = new Map();
            this.cache.set(fn, paramCache);
        }

        if (!paramCache.has(serialisedParams)) {
            return this.invoke(callers, fn, paramCache, serialisedParams, ...params);
        }

        return paramCache.get(serialisedParams);
    }

    private invoke<F extends AnyFn>(
        callers: Caller | Caller[],
        fn: F,
        paramCache: Map<string, any> | undefined,
        serialisedParams: string | undefined,
        ...params: Parameters<F>
    ) {
        try {
            const result = callWithContext(callers, fn, ...params);
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
