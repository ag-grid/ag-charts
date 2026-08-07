import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger, reset, warn, warnOnce } from './logger';

describe('Logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => void 0);
        vi.spyOn(console, 'error').mockImplementation(() => void 0);
        vi.spyOn(console, 'log').mockImplementation(() => void 0);
        vi.spyOn(console, 'groupCollapsed').mockImplementation(() => void 0);
        vi.spyOn(console, 'groupEnd').mockImplementation(() => void 0);
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

        it('emits the same output from the ambient free function as from an instance', () => {
            warn('shared message');
            expect(console.warn).toHaveBeenCalledWith('AG Charts - shared message');
        });
    });

    describe('setLevel', () => {
        it('silences deprecation, warn and error at "none"', () => {
            const logger = new Logger();
            logger.setLevel('none');
            logger.deprecation('d');
            logger.warn('w');
            logger.error('e');
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });

        it('emits only error at "error"', () => {
            const logger = new Logger();
            logger.setLevel('error');
            logger.deprecation('d');
            logger.warn('w');
            logger.error('e');
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        it('emits warn and error but not deprecation at "warning"', () => {
            const logger = new Logger();
            logger.setLevel('warning');
            logger.deprecation('d');
            logger.warn('w');
            logger.error('e');
            expect(console.warn).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalledWith('AG Charts - w');
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        it('emits all three at "deprecation" and by default (anti-vacuity control)', () => {
            const atDeprecation = new Logger();
            atDeprecation.setLevel('deprecation');
            atDeprecation.deprecation('d');
            atDeprecation.warn('w');
            atDeprecation.error('e');
            expect(console.warn).toHaveBeenCalledTimes(2);
            expect(console.error).toHaveBeenCalledTimes(1);

            vi.mocked(console.warn).mockClear();
            vi.mocked(console.error).mockClear();

            const defaultLogger = new Logger();
            defaultLogger.deprecation('d');
            defaultLogger.warn('w');
            defaultLogger.error('e');
            expect(console.warn).toHaveBeenCalledTimes(2);
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        it('applies a level change to messages logged after the change, not retroactively', () => {
            const logger = new Logger();
            logger.warn('before');
            expect(console.warn).toHaveBeenCalledTimes(1);

            logger.setLevel('error');
            logger.warn('after');
            expect(console.warn).toHaveBeenCalledTimes(1);
        });

        it('dedupes deprecationOnce independently from warnOnce for the same message text', () => {
            const logger = new Logger();
            logger.warnOnce('same text');
            logger.deprecationOnce('same text');
            expect(console.warn).toHaveBeenCalledTimes(2);

            logger.warnOnce('same text');
            logger.deprecationOnce('same text');
            expect(console.warn).toHaveBeenCalledTimes(2);
        });

        it('re-emits a warnOnce message once the level is lowered below what suppressed it', () => {
            const logger = new Logger();
            logger.setLevel('error');
            logger.warnOnce('x');
            expect(console.warn).not.toHaveBeenCalled();

            logger.setLevel('deprecation');
            logger.warnOnce('x');
            expect(console.warn).toHaveBeenCalledTimes(1);
        });

        it('re-emits a deprecationOnce message once the level is lowered below what suppressed it', () => {
            const logger = new Logger();
            logger.setLevel('warning');
            logger.deprecationOnce('y');
            expect(console.warn).not.toHaveBeenCalled();

            logger.setLevel('deprecation');
            logger.deprecationOnce('y');
            expect(console.warn).toHaveBeenCalledTimes(1);
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

    describe('logGroup', () => {
        it('leaves console grouping untouched when the group logs nothing', () => {
            new Logger().logGroup('empty', () => void 0);
            expect(console.groupCollapsed).not.toHaveBeenCalled();
            expect(console.groupEnd).not.toHaveBeenCalled();
        });

        it('does not open the group for a message its severity floor suppresses', () => {
            // `'error'` is a quieter-than-warn floor, so a warn inside the group is gated out.
            const logger = new Logger();
            logger.setLevel('error');
            logger.logGroup('gated', () => logger.warn('suppressed'));
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.groupCollapsed).not.toHaveBeenCalled();
            expect(console.groupEnd).not.toHaveBeenCalled();
        });

        it('does not open the group for a warnOnce the dedup cache swallows', () => {
            const logger = new Logger();
            logger.warnOnce('deduped');
            expect(console.groupCollapsed).not.toHaveBeenCalled();

            logger.logGroup('gated', () => logger.warnOnce('deduped'));
            expect(console.warn).toHaveBeenCalledTimes(1);
            expect(console.groupCollapsed).not.toHaveBeenCalled();
        });

        it('opens the group once, before the message, and closes it after', () => {
            const order: string[] = [];
            vi.mocked(console.groupCollapsed).mockImplementation((name?: any) => order.push(`open:${name}`));
            vi.mocked(console.log).mockImplementation((...content: any[]) => order.push(`log:${content[0]}`));
            vi.mocked(console.groupEnd).mockImplementation(() => order.push('end'));

            const logger = new Logger();
            logger.logGroup('outer', () => {
                logger.log('first');
                logger.log('second');
            });

            expect(order).toEqual(['open:outer', 'log:first', 'log:second', 'end']);
        });

        it('opens enclosing groups outermost-first when only the inner group logs', () => {
            const logger = new Logger();
            logger.logGroup('outer', () => {
                logger.logGroup('inner', () => logger.log('deep'));
            });

            expect(vi.mocked(console.groupCollapsed).mock.calls).toEqual([['outer'], ['inner']]);
            expect(console.groupEnd).toHaveBeenCalledTimes(2);
        });

        it('closes an opened group when the callback throws', () => {
            const logger = new Logger();
            expect(() =>
                logger.logGroup('throwing', () => {
                    logger.log('before the throw');
                    throw new Error('boom');
                })
            ).toThrow('boom');

            expect(console.groupCollapsed).toHaveBeenCalledTimes(1);
            expect(console.groupEnd).toHaveBeenCalledTimes(1);
        });

        it('closes an async group only once it resolves', async () => {
            const logger = new Logger();
            let release: () => void;
            const gate = new Promise<void>((resolve) => (release = resolve));

            const pending = logger.logGroup('async', async () => {
                logger.log('inside');
                await gate;
            });

            expect(console.groupCollapsed).toHaveBeenCalledTimes(1);
            expect(console.groupEnd).not.toHaveBeenCalled();

            release!();
            await pending;
            expect(console.groupEnd).toHaveBeenCalledTimes(1);
        });

        it('balances open and close calls when async groups close out of order', async () => {
            const logger = new Logger();
            const outerGate = new Promise<void>((resolve) => setTimeout(resolve, 10));

            const outer = logger.logGroup('outer', async () => {
                logger.log('outer message');
                await outerGate;
            });
            const inner = logger.logGroup('inner', async () => {
                logger.log('inner message');
                await Promise.resolve();
            });

            await Promise.all([inner, outer]);
            expect(vi.mocked(console.groupEnd).mock.calls).toHaveLength(
                vi.mocked(console.groupCollapsed).mock.calls.length
            );
        });
    });

    describe('ambient fallback', () => {
        it('shares one dedup cache across the free functions', () => {
            warnOnce('fallback message');
            warnOnce('fallback message');
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
