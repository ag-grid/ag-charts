import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger, reset, warnOnce } from './logger';

describe('Logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => void 0);
        vi.spyOn(console, 'error').mockImplementation(() => void 0);
        reset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('console output format', () => {
        it('prefixes warn messages with "AG Charts - "', () => {
            new Logger().warn('something went wrong', { detail: 1 });
            expect(console.warn).toHaveBeenCalledWith('AG Charts - something went wrong', { detail: 1 });
        });

        it('prefixes string error messages with "AG Charts - "', () => {
            new Logger().error('boom', 'extra');
            expect(console.error).toHaveBeenCalledWith('AG Charts - boom', 'extra');
        });

        it('logs object errors under the "AG Charts error" label', () => {
            const err = { code: 42 };
            new Logger().error(err, 'context');
            expect(console.error).toHaveBeenCalledWith('AG Charts error', err, 'context');
        });

        it('emits the same output from the static fallback as from an instance', () => {
            Logger.warn('shared message');
            expect(console.warn).toHaveBeenCalledWith('AG Charts - shared message');
        });
    });

    describe('per-instance dedup', () => {
        it('suppresses a repeated warnOnce within one instance', () => {
            const logger = new Logger();
            logger.warnOnce('repeat me');
            logger.warnOnce('repeat me');
            expect(console.warn).toHaveBeenCalledTimes(1);
        });

        it('keeps dedup caches independent across instances', () => {
            const a = new Logger();
            const b = new Logger();
            a.warnOnce('same message');
            b.warnOnce('same message');
            expect(console.warn).toHaveBeenCalledTimes(2);
        });

        it('re-emits after destroy() clears the instance cache', () => {
            const logger = new Logger();
            logger.warnOnce('cached');
            logger.destroy();
            logger.warnOnce('cached');
            expect(console.warn).toHaveBeenCalledTimes(2);
        });
    });

    describe('module-default fallback', () => {
        it('shares one dedup cache between the free functions and the static methods', () => {
            warnOnce('fallback message');
            Logger.warnOnce('fallback message');
            expect(console.warn).toHaveBeenCalledTimes(1);
        });

        it('re-emits after the free-function reset() clears the fallback cache', () => {
            warnOnce('once');
            reset();
            warnOnce('once');
            expect(console.warn).toHaveBeenCalledTimes(2);
        });
    });
});
