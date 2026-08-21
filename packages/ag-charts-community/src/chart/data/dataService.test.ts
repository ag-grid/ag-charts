import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AgDocument, EventEmitter, ambientLog, getDocument } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';

import { Mutex } from '../../util/mutex';
import { AnimationManager } from '../interaction/animationManager';
import { InteractionManager } from '../interaction/interactionManager';
import { DataService } from './dataService';

const REQUEST_THROTTLE = 1;

function sleep() {
    return new Promise((resolve) => setTimeout(resolve, REQUEST_THROTTLE));
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
}

describe('DataService', () => {
    let dataService: DataService<any>;
    let eventsHub: EventEmitter<any>;
    let eventEmitSpy: MockInstance;

    const undefinedWindow = { windowStart: undefined, windowEnd: undefined };
    const definedWindow = { windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-12-31') };

    beforeEach(() => {
        eventsHub = new EventEmitter();
        eventEmitSpy = vi.spyOn(eventsHub, 'emit');

        const interactionManager = new InteractionManager();
        const chartUpdateMutex = new Mutex();
        const animationManager = new AnimationManager(
            new AgDocument(getDocument()),
            interactionManager,
            chartUpdateMutex,
            testLogger
        );
        dataService = new DataService(eventsHub, {}, animationManager, testLogger);
        dataService.requestThrottle = REQUEST_THROTTLE;
    });

    afterEach(() => {
        dataService.clearCallback();
        eventEmitSpy.mockReset();
        eventEmitSpy.mockRestore();
    });

    it('should emit `data:load` and callback with an undefined window', async () => {
        const data = [{ datum: 'value' }];
        const dataSourceCallback = vi.fn((_params) => Promise.resolve(data));
        dataService.updateCallback(dataSourceCallback);
        dataService.load(undefinedWindow);

        await sleep();

        expect(dataSourceCallback).toHaveBeenCalledTimes(1);
        expect(dataSourceCallback).toHaveBeenCalledWith(undefinedWindow);
        expect(eventEmitSpy).toHaveBeenCalledWith('data:load', expect.objectContaining({ data }));
    });

    it('should emit `data:load` and callback with a defined window', async () => {
        const data = [{ datum: 'value' }];
        const dataSourceCallback = vi.fn((_params) => Promise.resolve(data));
        dataService.updateCallback(dataSourceCallback);
        dataService.load(definedWindow);

        await sleep();

        expect(dataSourceCallback).toHaveBeenCalledTimes(1);
        expect(dataSourceCallback).toHaveBeenCalledWith(definedWindow);
        expect(eventEmitSpy).toHaveBeenCalledWith('data:load', expect.objectContaining({ data }));
    });

    describe('pending data', () => {
        afterEach(() => {
            (dataService as any).pendingData = undefined;
        });

        it('should emit `data:load` with restored data and NOT callback with an undefined window', async () => {
            const dataCallback = [{ datum: 'value' }];
            const dataRestored = [{ restored: 'other-value' }];
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(dataCallback));
            dataService.updateCallback(dataSourceCallback);
            dataService.restoreData({ params: undefinedWindow, data: dataRestored });
            dataService.load(undefinedWindow);

            await sleep();

            expect(dataSourceCallback).not.toHaveBeenCalled();
            expect(eventEmitSpy).toHaveBeenCalledWith('data:load', expect.objectContaining({ data: dataRestored }));
        });

        it('should emit `data:load` with restored data and NOT callback with a defined window', async () => {
            const dataCallback = [{ datum: 'value' }];
            const dataRestored = [{ restored: 'other-value' }];
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(dataCallback));
            dataService.updateCallback(dataSourceCallback);
            dataService.restoreData({ params: definedWindow, data: dataRestored });
            dataService.load(definedWindow);

            await sleep();

            expect(dataSourceCallback).not.toHaveBeenCalled();
            expect(eventEmitSpy).toHaveBeenCalledWith('data:load', expect.objectContaining({ data: dataRestored }));
        });

        it('should emit `data:load` with callback data if pending window does not match requested window', async () => {
            const dataCallback = [{ datum: 'value' }];
            const dataRestored = [{ restored: 'other-value' }];
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(dataCallback));
            dataService.updateCallback(dataSourceCallback);
            dataService.restoreData({ params: definedWindow, data: dataRestored });
            dataService.load({ windowStart: new Date('2025-04-01'), windowEnd: definedWindow.windowEnd });

            await sleep();

            expect(dataSourceCallback).toHaveBeenCalledTimes(1);
            expect(dataSourceCallback).toHaveBeenCalledWith({
                windowStart: new Date('2025-04-01'),
                windowEnd: definedWindow.windowEnd,
            });
            expect(eventEmitSpy).toHaveBeenCalledWith('data:load', expect.objectContaining({ data: dataCallback }));
        });

        it('should emit `data:load` with restored data and NOT callback if pending window is undefined and requested window is defined', async () => {
            const dataCallback = [{ datum: 'value' }];
            const dataRestored = [{ restored: 'other-value' }];
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(dataCallback));
            dataService.updateCallback(dataSourceCallback);
            dataService.restoreData({ params: undefinedWindow, data: dataRestored });
            dataService.load(definedWindow);

            await sleep();

            expect(dataSourceCallback).not.toHaveBeenCalled();
            expect(eventEmitSpy).toHaveBeenCalledWith('data:load', expect.objectContaining({ data: dataRestored }));
        });
    });

    describe('invalid getData response', () => {
        let consoleWarnSpy: MockInstance;

        const arrayWarning = (calls: unknown[][]) =>
            calls.filter((args) => typeof args[0] === 'string' && args[0].includes('expecting an array'));
        const requestFailedWarning = (calls: unknown[][]) =>
            calls.filter((args) => typeof args[0] === 'string' && args[0].includes('request failed'));

        beforeEach(() => {
            ambientLog.reset();
            consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        });

        afterEach(() => {
            consoleWarnSpy.mockRestore();
        });

        it.each([
            ['undefined', undefined],
            ['null', null],
            ['a plain object', { not: 'an array' }],
        ])('should warn and emit `data:error` when the callback resolves to %s', async (_label, value) => {
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(value));
            dataService.updateCallback(dataSourceCallback);
            dataService.load(undefinedWindow);

            await sleep();

            expect(eventEmitSpy).toHaveBeenCalledWith('data:error', expect.objectContaining({}));
            expect(eventEmitSpy).not.toHaveBeenCalledWith('data:load', expect.anything());
            expect(arrayWarning(consoleWarnSpy.mock.calls)).toHaveLength(1);
        });

        // A non-empty array is structurally valid at the series-agnostic DataService boundary, so it is
        // dispatched without a warning even when its rows cannot render against the series keys.
        it.each([
            ['objects with custom keys', [{ foo: 1 }, { bar: 2 }]],
            ['primitives', [1, 2, 3]],
            ['objects with only null field values', [{ x: null, y: null }]],
        ])(
            'should emit `data:load` without warning when the callback resolves to an array of %s',
            async (_label, data) => {
                const dataSourceCallback = vi.fn((_params) => Promise.resolve(data));
                dataService.updateCallback(dataSourceCallback);
                dataService.load(undefinedWindow);

                await sleep();

                expect(eventEmitSpy).toHaveBeenCalledWith('data:load', expect.objectContaining({ data }));
                expect(arrayWarning(consoleWarnSpy.mock.calls)).toHaveLength(0);
            }
        );

        it('should retain previous data (emit `data:error`, not `data:load`) and NOT warn on an empty array', async () => {
            const dataSourceCallback = vi.fn((_params) => Promise.resolve([]));
            dataService.updateCallback(dataSourceCallback);
            dataService.load(undefinedWindow);

            await sleep();

            expect(eventEmitSpy).toHaveBeenCalledWith('data:error', expect.objectContaining({}));
            expect(eventEmitSpy).not.toHaveBeenCalledWith('data:load', expect.anything());
            expect(arrayWarning(consoleWarnSpy.mock.calls)).toHaveLength(0);
        });

        it('should warn only once across repeated invalid responses', async () => {
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(undefined));
            dataService.updateCallback(dataSourceCallback);

            dataService.load(undefinedWindow);
            await sleep();
            dataService.load(definedWindow);
            await sleep();

            expect(dataSourceCallback).toHaveBeenCalledTimes(2);
            expect(arrayWarning(consoleWarnSpy.mock.calls)).toHaveLength(1);
        });

        it('should not wedge the initial load: a later valid response still emits `data:load`', async () => {
            const dataSourceCallback = vi
                .fn()
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce([{ datum: 'value' }]);
            dataService.updateCallback(dataSourceCallback);

            dataService.load(undefinedWindow);
            await sleep();

            expect(eventEmitSpy).toHaveBeenCalledWith('data:error', expect.objectContaining({}));
            expect(eventEmitSpy).not.toHaveBeenCalledWith('data:load', expect.anything());

            dataService.load(definedWindow);
            await sleep();

            expect(eventEmitSpy).toHaveBeenCalledWith(
                'data:load',
                expect.objectContaining({ data: [{ datum: 'value' }] })
            );
        });

        it('should warn once about the failure and NOT the array warning when the callback rejects', async () => {
            const dataSourceCallback = vi.fn((_params) => Promise.reject(new Error('boom')));
            dataService.updateCallback(dataSourceCallback);
            dataService.load(undefinedWindow);

            await sleep();

            expect(requestFailedWarning(consoleWarnSpy.mock.calls)).toHaveLength(1);
            expect(arrayWarning(consoleWarnSpy.mock.calls)).toHaveLength(0);
            expect(eventEmitSpy).toHaveBeenCalledWith('data:error', expect.objectContaining({}));
        });

        it('should resolve `getData()` to undefined when no valid response has been dispatched', async () => {
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(undefined));
            dataService.updateCallback(dataSourceCallback);
            dataService.load(undefinedWindow);

            await sleep();

            await expect(dataService.getData()).resolves.toBeUndefined();
        });

        it('should resolve `getData()` to the last valid data after a later invalid response', async () => {
            const validData = [{ datum: 'value' }];
            const dataSourceCallback = vi.fn().mockResolvedValueOnce(validData).mockResolvedValueOnce(undefined);
            dataService.updateCallback(dataSourceCallback);

            dataService.load(undefinedWindow);
            await sleep();
            dataService.load(definedWindow);
            await sleep();

            await expect(dataService.getData()).resolves.toEqual(expect.objectContaining({ data: validData }));
        });

        it('should echo the requestId on `data:error` so a stale error can be correlated', async () => {
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(undefined));
            dataService.updateCallback(dataSourceCallback);
            dataService.load(undefinedWindow, 42);

            await sleep();

            expect(eventEmitSpy).toHaveBeenCalledWith('data:error', { requestId: 42 });
        });
    });

    describe('secondary loader (navigator mini-chart) response validation', () => {
        it.each([
            ['a non-array response', undefined],
            ['an empty array', []],
        ])(
            'should not forward %s to the secondary loader so the mini-chart retains its last valid display',
            async (_label, miniChartResponse) => {
                const secondaryCallback = vi.fn();
                const dataSourceCallback = vi.fn(({ source }) =>
                    Promise.resolve(source === 'mini-chart' ? miniChartResponse : [{ datum: 'value' }])
                );
                dataService.updateCallback(dataSourceCallback);
                dataService.registerSecondaryLoader('mini-chart', ['chart-update'], secondaryCallback);
                dataService.load({ ...undefinedWindow, source: 'chart-update' });

                await sleep();

                expect(dataSourceCallback).toHaveBeenCalledWith(expect.objectContaining({ source: 'mini-chart' }));
                expect(secondaryCallback).not.toHaveBeenCalled();
            }
        );

        it('should forward a valid non-empty array to the secondary loader', async () => {
            const miniChartData = [{ datum: 'mini' }];
            const secondaryCallback = vi.fn();
            const dataSourceCallback = vi.fn(({ source }) =>
                Promise.resolve(source === 'mini-chart' ? miniChartData : [{ datum: 'value' }])
            );
            dataService.updateCallback(dataSourceCallback);
            dataService.registerSecondaryLoader('mini-chart', ['chart-update'], secondaryCallback);
            dataService.load({ ...undefinedWindow, source: 'chart-update' });

            await sleep();

            expect(secondaryCallback).toHaveBeenCalledWith(miniChartData);
        });
    });

    describe('superseded (stale) requests', () => {
        const dataLoadCalls = () =>
            eventEmitSpy.mock.calls.filter(([event]) => event === 'data:load').map(([, payload]) => payload.data);

        it('should not dispatch an earlier request that resolves after the latest one', async () => {
            const requests = [deferred<any>(), deferred<any>()];
            let call = 0;
            const dataSourceCallback = vi.fn((_params) => requests[call++].promise);
            dataService.updateCallback(dataSourceCallback);

            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-02-01') });
            await sleep();
            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-03-01') });
            await sleep();

            requests[1].resolve([{ datum: 'latest' }]);
            await sleep();
            requests[0].resolve([{ datum: 'stale' }]);
            await sleep();

            expect(dataSourceCallback).toHaveBeenCalledTimes(2);
            expect(dataLoadCalls()).toEqual([[{ datum: 'latest' }]]);
        });

        it('should not dispatch an earlier request that resolves while the latest is still in flight', async () => {
            const requests = [deferred<any>(), deferred<any>()];
            let call = 0;
            const dataSourceCallback = vi.fn((_params) => requests[call++].promise);
            dataService.updateCallback(dataSourceCallback);

            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-02-01') });
            await sleep();
            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-03-01') });
            await sleep();

            requests[0].resolve([{ datum: 'stale' }]);
            await sleep();

            expect(dataLoadCalls()).toEqual([]);

            requests[1].resolve([{ datum: 'latest' }]);
            await sleep();

            expect(dataLoadCalls()).toEqual([[{ datum: 'latest' }]]);
        });

        it('should not emit `data:error` for a superseded request, so the latest window is not rolled back', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const requests = [deferred<any>(), deferred<any>()];
            let call = 0;
            const dataSourceCallback = vi.fn((_params) => requests[call++].promise);
            dataService.updateCallback(dataSourceCallback);

            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-02-01') }, 1);
            await sleep();
            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-03-01') }, 2);
            await sleep();

            requests[1].resolve([{ datum: 'latest' }]);
            await sleep();
            requests[0].resolve([]);
            await sleep();

            expect(eventEmitSpy).not.toHaveBeenCalledWith('data:error', expect.anything());
            consoleWarnSpy.mockRestore();
        });

        it('should not forward a superseded secondary (mini-chart) response', async () => {
            const primaries = [deferred<any>(), deferred<any>()];
            const secondaries = [deferred<any>(), deferred<any>()];
            let call = 0;
            const dataSourceCallback = vi.fn(({ source }) => {
                const index = source === 'mini-chart' ? call : call++;
                return source === 'mini-chart' ? secondaries[index].promise : primaries[index].promise;
            });
            const secondaryCallback = vi.fn();
            dataService.updateCallback(dataSourceCallback);
            dataService.registerSecondaryLoader('mini-chart', ['chart-update'], secondaryCallback);

            dataService.load({ ...definedWindow, source: 'chart-update' });
            await sleep();
            dataService.load({
                windowStart: definedWindow.windowStart,
                windowEnd: new Date('2025-06-01'),
                source: 'chart-update',
            });
            await sleep();

            primaries[1].resolve([{ datum: 'latest' }]);
            secondaries[1].resolve([{ datum: 'mini-latest' }]);
            await sleep();

            primaries[0].resolve([{ datum: 'stale' }]);
            secondaries[0].resolve([{ datum: 'mini-stale' }]);
            await sleep();

            expect(secondaryCallback).toHaveBeenCalledTimes(1);
            expect(secondaryCallback).toHaveBeenCalledWith([{ datum: 'mini-latest' }]);
        });

        it('should discard an earlier request whose primary resolved first but whose secondary settles after the latest dispatched', async () => {
            const primaries = [deferred<any>(), deferred<any>()];
            const secondaries = [deferred<any>(), deferred<any>()];
            let call = 0;
            const dataSourceCallback = vi.fn(({ source }) => {
                const index = source === 'mini-chart' ? call : call++;
                return source === 'mini-chart' ? secondaries[index].promise : primaries[index].promise;
            });
            const secondaryCallback = vi.fn();
            dataService.updateCallback(dataSourceCallback);
            dataService.registerSecondaryLoader('mini-chart', ['chart-update'], secondaryCallback);

            dataService.load({ ...definedWindow, source: 'chart-update' });
            await sleep();

            // The earlier request's primary lands while it is still the only one in flight; its
            // mini-chart request is outstanding, so nothing may be applied yet.
            primaries[0].resolve([{ datum: 'stale' }]);
            await sleep();

            expect(dataLoadCalls()).toEqual([]);

            dataService.load({
                windowStart: definedWindow.windowStart,
                windowEnd: new Date('2025-06-01'),
                source: 'chart-update',
            });
            await sleep();

            primaries[1].resolve([{ datum: 'latest' }]);
            secondaries[1].resolve([{ datum: 'mini-latest' }]);
            await sleep();

            secondaries[0].resolve([{ datum: 'mini-stale' }]);
            await sleep();

            expect(dataLoadCalls()).toEqual([[{ datum: 'latest' }]]);
            expect(secondaryCallback).toHaveBeenCalledTimes(1);
            expect(secondaryCallback).toHaveBeenCalledWith([{ datum: 'mini-latest' }]);
        });

        it('should still forward a secondary response whose primary was superseded by a request that does not trigger the loader', async () => {
            const primaries = [deferred<any>(), deferred<any>()];
            const secondary = deferred<any>();
            let call = 0;
            const dataSourceCallback = vi.fn(({ source }) =>
                source === 'mini-chart' ? secondary.promise : primaries[call++].promise
            );
            const secondaryCallback = vi.fn();
            dataService.updateCallback(dataSourceCallback);
            dataService.registerSecondaryLoader('mini-chart', ['chart-update'], secondaryCallback);

            dataService.load({ ...definedWindow, source: 'chart-update' });
            await sleep();

            // A navigator pan is not a trigger for the loader, so this request carries no
            // replacement overview data — dropping the outstanding one would lose it entirely.
            dataService.load({
                windowStart: definedWindow.windowStart,
                windowEnd: new Date('2025-06-01'),
                source: 'user-interaction',
            });
            await sleep();

            primaries[1].resolve([{ datum: 'latest' }]);
            await sleep();
            primaries[0].resolve([{ datum: 'stale' }]);
            secondary.resolve([{ datum: 'mini' }]);
            await sleep();

            expect(dataSourceCallback).not.toHaveBeenCalledWith(
                expect.objectContaining({ source: 'mini-chart', windowEnd: new Date('2025-06-01') })
            );
            expect(dataLoadCalls()).toEqual([[{ datum: 'latest' }]]);
            expect(secondaryCallback).toHaveBeenCalledWith([{ datum: 'mini' }]);
        });

        // `dispatchOnlyLatest` is `!dataSource.updateDuringInteraction`, so `false` asks for every
        // response to be shown as it arrives — but never in an order that moves the chart backwards.
        describe('with `dispatchOnlyLatest: false`', () => {
            beforeEach(() => {
                dataService.dispatchOnlyLatest = false;
            });

            it('should dispatch every overlapping request that resolves in issue order', async () => {
                const requests = [deferred<any>(), deferred<any>(), deferred<any>()];
                let call = 0;
                const dataSourceCallback = vi.fn((_params) => requests[call++].promise);
                dataService.updateCallback(dataSourceCallback);

                dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-02-01') });
                await sleep();
                dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-03-01') });
                await sleep();
                dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-04-01') });
                await sleep();

                requests[0].resolve([{ datum: 1 }]);
                await sleep();
                requests[1].resolve([{ datum: 2 }]);
                await sleep();
                requests[2].resolve([{ datum: 3 }]);
                await sleep();

                expect(dataLoadCalls()).toEqual([[{ datum: 1 }], [{ datum: 2 }], [{ datum: 3 }]]);
            });

            it('should discard a request that resolves after a later one has been dispatched', async () => {
                const requests = [deferred<any>(), deferred<any>(), deferred<any>()];
                let call = 0;
                const dataSourceCallback = vi.fn((_params) => requests[call++].promise);
                dataService.updateCallback(dataSourceCallback);

                dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-02-01') });
                await sleep();
                dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-03-01') });
                await sleep();
                dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-04-01') });
                await sleep();

                requests[2].resolve([{ datum: 3 }]);
                await sleep();
                requests[0].resolve([{ datum: 1 }]);
                requests[1].resolve([{ datum: 2 }]);
                await sleep();

                expect(dataLoadCalls()).toEqual([[{ datum: 3 }]]);
            });

            it('should forward each secondary response as it arrives, independently of the primary', async () => {
                const primary = deferred<any>();
                const secondaries = [deferred<any>(), deferred<any>()];
                let call = 0;
                const dataSourceCallback = vi.fn(({ source }) =>
                    source === 'mini-chart' ? secondaries[call++].promise : primary.promise
                );
                const secondaryCallback = vi.fn();
                dataService.updateCallback(dataSourceCallback);
                dataService.registerSecondaryLoader('mini-chart', ['chart-update'], secondaryCallback);

                dataService.load({ ...definedWindow, source: 'chart-update' });
                await sleep();
                dataService.load({
                    windowStart: definedWindow.windowStart,
                    windowEnd: new Date('2025-06-01'),
                    source: 'chart-update',
                });
                await sleep();

                // The primary never settles, so the loader's data is all that can be shown.
                secondaries[0].resolve([{ datum: 'mini-1' }]);
                await sleep();
                secondaries[1].resolve([{ datum: 'mini-2' }]);
                await sleep();

                expect(secondaryCallback.mock.calls).toEqual([[[{ datum: 'mini-1' }]], [[{ datum: 'mini-2' }]]]);
                expect(dataLoadCalls()).toEqual([]);
            });
        });
    });

    it('should echo the requestId on `data:load`', async () => {
        const data = [{ datum: 'value' }];
        const dataSourceCallback = vi.fn((_params) => Promise.resolve(data));
        dataService.updateCallback(dataSourceCallback);
        dataService.load(definedWindow, 7);

        await sleep();

        expect(eventEmitSpy).toHaveBeenCalledWith('data:load', { data, requestId: 7 });
    });

    describe('loading state', () => {
        const inFlightCount = () => (dataService as any).inFlightCount as number;

        let consoleWarnSpy: MockInstance;
        beforeEach(() => {
            consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        });
        afterEach(() => {
            consoleWarnSpy.mockRestore();
        });

        it('should report loading immediately after `load()`, before the throttled fetch fires', async () => {
            dataService.updateCallback(vi.fn((_params) => Promise.resolve([{ datum: 'value' }])));
            dataService.load(definedWindow);

            expect(dataService.isLoading()).toBe(true);

            // Let the throttled fetch settle so no pending request outlives the test.
            await sleep();
            expect(dataService.isLoading()).toBe(false);
        });

        it('should stay loading until ALL overlapping requests settle, even when the latest resolves first', async () => {
            const requests = [deferred<any>(), deferred<any>(), deferred<any>()];
            let call = 0;
            const dataSourceCallback = vi.fn((_params) => requests[call++].promise);
            dataService.updateCallback(dataSourceCallback);

            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-02-01') });
            await sleep();
            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-03-01') });
            await sleep();
            dataService.load({ windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-04-01') });
            await sleep();

            expect(dataSourceCallback).toHaveBeenCalledTimes(3);
            expect(dataService.isLoading()).toBe(true);

            // The newest request resolving first must NOT clear the loading state while the two earlier
            // overlapping requests are still in flight — otherwise the spinner flashes.
            requests[2].resolve([{ datum: 3 }]);
            await sleep();
            expect(dataService.isLoading()).toBe(true);

            requests[0].resolve([{ datum: 1 }]);
            await sleep();
            expect(dataService.isLoading()).toBe(true);

            requests[1].resolve([{ datum: 2 }]);
            await sleep();
            expect(dataService.isLoading()).toBe(false);
            expect(inFlightCount()).toBe(0);
        });

        it('should clear the loading state after an invalid response (no stuck spinner)', async () => {
            const dataSourceCallback = vi.fn((_params) => Promise.resolve(undefined));
            dataService.updateCallback(dataSourceCallback);
            dataService.load(definedWindow);

            await sleep();

            expect(dataService.isLoading()).toBe(false);
            expect(inFlightCount()).toBe(0);
        });

        it('should clear the loading state after the callback rejects (no stuck spinner)', async () => {
            const dataSourceCallback = vi.fn((_params) => Promise.reject(new Error('boom')));
            dataService.updateCallback(dataSourceCallback);
            dataService.load(definedWindow);

            await sleep();

            expect(dataService.isLoading()).toBe(false);
            expect(inFlightCount()).toBe(0);
        });

        it('should hold the loading state open until a secondary (mini-chart) request settles', async () => {
            const primary = deferred<any>();
            const secondary = deferred<any>();
            const dataSourceCallback = vi.fn(({ source }) =>
                source === 'mini-chart' ? secondary.promise : primary.promise
            );
            dataService.updateCallback(dataSourceCallback);
            dataService.registerSecondaryLoader('mini-chart', ['chart-update'], vi.fn());
            dataService.load({ ...undefinedWindow, source: 'chart-update' });

            await sleep();
            expect(dataService.isLoading()).toBe(true);

            // Primary settled but the mini-chart request is still outstanding.
            primary.resolve([{ datum: 'value' }]);
            await sleep();
            expect(dataService.isLoading()).toBe(true);

            secondary.resolve([{ datum: 'mini' }]);
            await sleep();
            expect(dataService.isLoading()).toBe(false);
            expect(inFlightCount()).toBe(0);
        });
    });
});
