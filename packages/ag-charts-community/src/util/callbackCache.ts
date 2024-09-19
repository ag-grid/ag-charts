import { Destructible } from './destroy';
import { Logger } from './logger';

export class CallbackCache extends Destructible {
    private cache: WeakMap<Function, Map<string, any>> = new WeakMap();

    call<F extends (...args: any[]) => any>(fn: F, ...params: Parameters<F>): ReturnType<F> | undefined {
        let serialisedParams: string;
        let paramCache = this.cache.get(fn);

        try {
            serialisedParams = JSON.stringify(params);
        } catch (e) {
            // Unable to serialise params!
            // No caching possible.

            return this.invoke(fn, params, paramCache);
        }

        if (paramCache == null) {
            paramCache = new Map();
            this.cache.set(fn, paramCache);
        }

        if (!paramCache.has(serialisedParams)) {
            return this.invoke(fn, params, paramCache, serialisedParams);
        }

        return paramCache.get(serialisedParams);
    }

    private invoke(fn: Function, params: any[], paramCache?: Map<string, any>, serialisedParams?: string) {
        try {
            const result = fn(...params);
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

    protected override destructor() {
        this.invalidateCache();
    }
}
