import { Logger } from './logger';

export class CallbackCache {
    private cache: WeakMap<Function, Map<string, any>> = new WeakMap();

    call<F extends (...args: any[]) => any>(fn: F, ...params: Parameters<F>): ReturnType<F> | undefined {
        let serialisedParams: string;
        let paramCache = this.cache.get(fn);

        const invoke = () => {
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
        };

        try {
            serialisedParams = JSON.stringify(params);
        } catch (e) {
            // Unable to serialise params!
            // No caching possible.

            return invoke();
        }

        if (paramCache == null) {
            paramCache = new Map();
            this.cache.set(fn, paramCache);
        }

        if (!paramCache.has(serialisedParams)) {
            return invoke();
        }

        return paramCache.get(serialisedParams);
    }

    invalidateCache() {
        this.cache = new WeakMap();
    }
}
