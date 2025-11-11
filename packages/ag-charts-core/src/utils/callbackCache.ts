import { Logger } from '../globals';
import type { Callback, CallbackParam, RequireOptional } from '../interfaces/globalTypes';

type Caller = { context?: unknown } | undefined;

export type CallbackParamRules<P> = RequireOptional<Omit<P, 'context'>>;

function needsContext<F extends Callback>(
    caller: NonNullable<Caller>,
    _params: CallbackParam<F>
): _params is CallbackParam<F> & { context: unknown } {
    return 'context' in caller;
}

function maybeSetContext<F extends Callback>(caller: Caller, params: CallbackParam<F>): boolean {
    if (caller != null && needsContext(caller, params)) {
        if (params != null && typeof params === 'object' && params.context === undefined) {
            params.context = caller.context;
            return true;
        }
    }
    return false;
}
export function callWithContext<F extends Callback>(
    callers: Caller | Caller[],
    fn: F,
    params: CallbackParam<F>
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
    return fn(params);
}

export class CallbackCache {
    private cache: WeakMap<Function, Map<string, any>> = new WeakMap();

    call<F extends Callback>(callers: Caller | Caller[], fn: F, params: CallbackParam<F>): ReturnType<F> | undefined {
        let serialisedParams: string;
        let paramCache = this.cache.get(fn);

        try {
            serialisedParams = JSON.stringify(params);
        } catch {
            // Unable to serialise params!
            // No caching possible.

            return this.invoke(callers, fn, paramCache, undefined, params);
        }

        if (paramCache == null) {
            paramCache = new Map();
            this.cache.set(fn, paramCache);
        }

        if (!paramCache.has(serialisedParams)) {
            return this.invoke(callers, fn, paramCache, serialisedParams, params);
        }

        return paramCache.get(serialisedParams);
    }

    private invoke<F extends Callback>(
        callers: Caller | Caller[],
        fn: F,
        paramCache: Map<string, any> | undefined,
        serialisedParams: string | undefined,
        params: CallbackParam<F>
    ) {
        try {
            const result = callWithContext(callers, fn, params);
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
