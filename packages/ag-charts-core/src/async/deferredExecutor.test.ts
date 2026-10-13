import { vi } from 'vitest';

import { DeferredExecutor } from './deferredExecutor';

describe('DeferredExecutor', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('schedule', () => {
        it('should schedule computation for deferred execution', () => {
            const executor = new DeferredExecutor<number>();
            const computation = vi.fn(() => 42);
            const onComplete = vi.fn();

            executor.schedule(computation, onComplete);

            expect(executor.isPending()).toBe(true);
            expect(computation).not.toHaveBeenCalled();
            expect(onComplete).not.toHaveBeenCalled();
        });

        it('should execute scheduled computation after timeout', () => {
            const executor = new DeferredExecutor<number>();
            const computation = vi.fn(() => 42);
            const onComplete = vi.fn();

            executor.schedule(computation, onComplete);
            vi.runAllTimers();

            expect(executor.isPending()).toBe(false);
            expect(computation).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledWith(42);
        });

        it('should cancel previous pending work when scheduling new work', () => {
            const executor = new DeferredExecutor<number>();
            const computation1 = vi.fn(() => 1);
            const onComplete1 = vi.fn();
            const computation2 = vi.fn(() => 2);
            const onComplete2 = vi.fn();

            executor.schedule(computation1, onComplete1);
            executor.schedule(computation2, onComplete2);
            vi.runAllTimers();

            expect(computation1).not.toHaveBeenCalled();
            expect(onComplete1).not.toHaveBeenCalled();
            expect(computation2).toHaveBeenCalledTimes(1);
            expect(onComplete2).toHaveBeenCalledWith(2);
        });
    });

    describe('demand', () => {
        it('should force immediate execution of pending computation', () => {
            const executor = new DeferredExecutor<number>();
            const computation = vi.fn(() => 42);
            const onComplete = vi.fn();

            executor.schedule(computation, onComplete);
            const result = executor.demand();

            expect(result).toBe(42);
            expect(executor.isPending()).toBe(false);
            expect(computation).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledWith(42);
        });

        it('should return undefined when nothing is pending', () => {
            const executor = new DeferredExecutor<number>();

            const result = executor.demand();

            expect(result).toBeUndefined();
        });

        it('should not execute again after demand', () => {
            const executor = new DeferredExecutor<number>();
            const computation = vi.fn(() => 42);
            const onComplete = vi.fn();

            executor.schedule(computation, onComplete);
            executor.demand();
            vi.runAllTimers();

            expect(computation).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledTimes(1);
        });
    });

    describe('cancel', () => {
        it('should cancel pending computation', () => {
            const executor = new DeferredExecutor<number>();
            const computation = vi.fn(() => 42);
            const onComplete = vi.fn();

            executor.schedule(computation, onComplete);
            executor.cancel();
            vi.runAllTimers();

            expect(executor.isPending()).toBe(false);
            expect(computation).not.toHaveBeenCalled();
            expect(onComplete).not.toHaveBeenCalled();
        });

        it('should be safe to call when nothing is pending', () => {
            const executor = new DeferredExecutor<number>();

            expect(() => executor.cancel()).not.toThrow();
        });
    });

    describe('isPending', () => {
        it('should return false initially', () => {
            const executor = new DeferredExecutor<number>();

            expect(executor.isPending()).toBe(false);
        });

        it('should return true after schedule', () => {
            const executor = new DeferredExecutor<number>();

            executor.schedule(
                () => 42,
                () => {}
            );

            expect(executor.isPending()).toBe(true);
        });

        it('should return false after execution completes', () => {
            const executor = new DeferredExecutor<number>();

            executor.schedule(
                () => 42,
                () => {}
            );
            vi.runAllTimers();

            expect(executor.isPending()).toBe(false);
        });
    });
});
