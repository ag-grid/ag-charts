import { vi } from 'vitest';

import { pause, withTimeout } from './async';

describe('Async Utilities', () => {
    describe('pause', () => {
        vi.useFakeTimers();

        afterEach(() => {
            vi.clearAllTimers();
        });

        it('resolves after the specified delay', async () => {
            const mockFn = vi.fn();
            const promise = pause(100).then(mockFn);

            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);
            await promise;

            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('resolves immediately when delay is 0', async () => {
            const mockFn = vi.fn();
            const promise = pause(0).then(mockFn);

            vi.advanceTimersByTime(0);
            await promise;

            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('withTimeout', () => {
        vi.useFakeTimers();

        afterEach(() => {
            vi.clearAllTimers();
        });

        it('resolves when promise completes before timeout', async () => {
            const promise = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 50);
            });

            const resultPromise = withTimeout(promise, 100);

            vi.advanceTimersByTime(50);
            const result = await resultPromise;

            expect(result).toBe('success');
        });

        it('rejects with default message when timeout expires', async () => {
            const promise = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 200);
            });

            const resultPromise = withTimeout(promise, 100);

            vi.advanceTimersByTime(100);

            await expect(resultPromise).rejects.toThrow('Timeout after 100ms');
        });

        it('rejects with custom message when timeout expires', async () => {
            const promise = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 200);
            });

            const resultPromise = withTimeout(promise, 100, 'Custom timeout error');

            vi.advanceTimersByTime(100);

            await expect(resultPromise).rejects.toThrow('Custom timeout error');
        });

        it('clears timeout timer on successful resolution', async () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

            const promise = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 50);
            });

            const resultPromise = withTimeout(promise, 100);

            vi.advanceTimersByTime(50);
            await resultPromise;

            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
        });

        it('preserves the type of the resolved value', async () => {
            const promise = new Promise<{ value: number }>((resolve) => {
                setTimeout(() => resolve({ value: 42 }), 50);
            });

            const resultPromise = withTimeout(promise, 100);

            vi.advanceTimersByTime(50);
            const result = await resultPromise;

            expect(result).toEqual({ value: 42 });
        });
    });
});
