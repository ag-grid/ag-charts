import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type LogIssue, Logger, reset, warn, warnOnce } from './logger';

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

    describe('setEnabledLevels', () => {
        it('silences deprecation, warn and error when no level is enabled', () => {
            const logger = new Logger();
            logger.setEnabledLevels([]);
            logger.deprecation('d');
            logger.warn('w');
            logger.error('e');
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });

        it('emits only error for ["error"]', () => {
            const logger = new Logger();
            logger.setEnabledLevels(['error']);
            logger.deprecation('d');
            logger.warn('w');
            logger.error('e');
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        it('emits warn and error but not deprecation for ["error", "warning"]', () => {
            const logger = new Logger();
            logger.setEnabledLevels(['error', 'warning']);
            logger.deprecation('d');
            logger.warn('w');
            logger.error('e');
            expect(console.warn).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalledWith('AG Charts - w');
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        it('emits warn but neither deprecation nor error for ["warning"]', () => {
            const logger = new Logger();
            logger.setEnabledLevels(['warning']);
            logger.deprecation('d');
            logger.warn('w');
            logger.error('e');
            expect(console.warn).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalledWith('AG Charts - w');
            expect(console.error).not.toHaveBeenCalled();
        });

        it('skips the intervening warn tier for ["error", "deprecation"]', () => {
            const logger = new Logger();
            logger.setEnabledLevels(['error', 'deprecation']);
            logger.deprecation('d');
            logger.warn('w');
            logger.error('e');
            // `deprecation` and `warn` share `console.warn`, so the message identifies which one ran.
            expect(console.warn).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalledWith('AG Charts - d');
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        it('emits all three for every level and by default (anti-vacuity control)', () => {
            const allEnabled = new Logger();
            allEnabled.setEnabledLevels(['error', 'warning', 'deprecation']);
            allEnabled.deprecation('d');
            allEnabled.warn('w');
            allEnabled.error('e');
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

            logger.setEnabledLevels(['error']);
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

        it('re-emits a warnOnce message once its level is enabled again', () => {
            const logger = new Logger();
            logger.setEnabledLevels(['error']);
            logger.warnOnce('x');
            expect(console.warn).not.toHaveBeenCalled();

            logger.setEnabledLevels(['error', 'warning', 'deprecation']);
            logger.warnOnce('x');
            expect(console.warn).toHaveBeenCalledTimes(1);
        });

        it('re-emits a deprecationOnce message once its level is enabled again', () => {
            const logger = new Logger();
            logger.setEnabledLevels(['error', 'warning']);
            logger.deprecationOnce('y');
            expect(console.warn).not.toHaveBeenCalled();

            logger.setEnabledLevels(['error', 'warning', 'deprecation']);
            logger.deprecationOnce('y');
            expect(console.warn).toHaveBeenCalledTimes(1);
        });
    });

    describe('onIssue', () => {
        it('reports every warn, error and deprecation at the severity of its console channel', () => {
            const logger = new Logger();
            const issues: LogIssue[] = [];
            logger.onIssue((issue) => issues.push(issue));

            logger.warn('w');
            logger.error('e');
            logger.deprecation('d');

            expect(issues).toEqual([
                { severity: 'warning', message: 'w' },
                { severity: 'error', message: 'e' },
                { severity: 'deprecation', message: 'd' },
            ]);
        });

        it('reports a message the enabled levels keep off the console', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);
            logger.setEnabledLevels([]);

            logger.warn('silenced');

            expect(console.warn).not.toHaveBeenCalled();
            expect(listener).toHaveBeenCalledWith({ severity: 'warning', message: 'silenced' });
        });

        it('reports every call of a *Once message, the once-cache gating the console only', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);

            logger.warnOnce('repeat');
            logger.warnOnce('repeat');

            expect(console.warn).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledTimes(2);
        });

        it('derives message, detail and cause from a logged Error', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);
            const error = new Error('boom');

            logger.error(error);

            expect(listener).toHaveBeenCalledWith({
                severity: 'error',
                message: 'boom',
                detail: error.stack,
                cause: error,
            });
        });

        it('appends further console arguments to detail, on repeats too', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);
            const error = new Error('callback failed');

            logger.warnOnce('Uncaught exception', error);
            logger.warnOnce('Uncaught exception', error);
            logger.warn('Invalid value', '[abc]', { key: 1 });

            expect(listener).toHaveBeenNthCalledWith(2, {
                severity: 'warning',
                message: 'Uncaught exception',
                detail: 'Error: callback failed',
            });
            expect(listener).toHaveBeenLastCalledWith({
                severity: 'warning',
                message: 'Invalid value',
                detail: '[abc]\n{"key":1}',
            });
        });

        it('falls back to String() for an argument JSON cannot serialise, rather than throwing out of the logging call', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);
            const circular: Record<string, unknown> = {};
            circular.self = circular;

            expect(() => logger.warn('Uncaught exception', circular, { big: 1n })).not.toThrow();
            expect(() => logger.warnOnce(circular)).not.toThrow();

            expect(listener).toHaveBeenNthCalledWith(1, {
                severity: 'warning',
                message: 'Uncaught exception',
                detail: '[object Object]\n[object Object]',
            });
            expect(listener).toHaveBeenNthCalledWith(2, { severity: 'warning', message: '[object Object]' });
        });

        it('serialises a null-prototype object, which has no toString, rather than throwing', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);
            const bare = Object.assign(Object.create(null), { code: 1 });

            expect(() => logger.warn('callback threw', bare)).not.toThrow();

            expect(listener).toHaveBeenCalledWith({
                severity: 'warning',
                message: 'callback threw',
                detail: '{"code":1}',
            });
        });

        it('keeps two distinct object messages apart, rather than collapsing both to [object Object]', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);

            logger.errorOnce({ a: 1 });
            logger.errorOnce({ a: 2 });

            expect(listener).toHaveBeenNthCalledWith(1, { severity: 'error', message: '{"a":1}' });
            expect(listener).toHaveBeenNthCalledWith(2, { severity: 'error', message: '{"a":2}' });
        });

        it('emits the same issue object for a repeat of a *Once message', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);

            logger.warnOnce('repeated', 'detail');
            logger.warnOnce('repeated', 'detail');
            logger.warnOnce('repeated', 'detail');

            expect(listener).toHaveBeenCalledTimes(3);
            expect(listener.mock.calls[1][0]).toEqual({ severity: 'warning', message: 'repeated', detail: 'detail' });
            expect(listener.mock.calls[1][0]).toBe(listener.mock.calls[2][0]);
        });

        it('stops emitting once the last subscriber unsubscribes', () => {
            const logger = new Logger();
            const listener = vi.fn();
            const unsubscribe = logger.onIssue(listener);
            const emit = vi.spyOn((logger as any).issues, 'emit');
            unsubscribe();

            logger.warn('after');

            expect(emit).not.toHaveBeenCalled();
            expect(listener).not.toHaveBeenCalled();
        });

        it('does not throw for a console argument JSON cannot serialise', () => {
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);
            const cyclic: Record<string, unknown> = {};
            cyclic.self = cyclic;

            expect(() => logger.warn('callback threw', cyclic, { big: 1n })).not.toThrow();
            expect(listener).toHaveBeenCalledWith({
                severity: 'warning',
                message: 'callback threw',
                detail: '[object Object]\n[object Object]',
            });
        });

        it('writes the console record before a throwing subscriber unwinds the logging call', () => {
            const logger = new Logger();
            logger.onIssue(() => {
                throw new Error('fail fast');
            });

            expect(() => logger.warn('problem')).toThrow('fail fast');
            expect(console.warn).toHaveBeenCalledWith('AG Charts - problem');
        });

        it('stops reporting once unsubscribed', () => {
            const logger = new Logger();
            const listener = vi.fn();
            const stop = logger.onIssue(listener);

            stop();
            logger.warn('unheard');

            expect(listener).not.toHaveBeenCalled();
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

        it('does not open the group for a message its enabled levels suppress', () => {
            // `'warning'` is not enabled, so a warn inside the group is gated out.
            const logger = new Logger();
            logger.setEnabledLevels(['error']);
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
