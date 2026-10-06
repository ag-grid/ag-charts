import { vi } from 'vitest';

import { debounce, throttle } from './functions';

describe('Functions Utilities', () => {
    describe('debounce', () => {
        vi.useFakeTimers();

        afterEach(() => {
            vi.clearAllTimers();
        });

        it('calls the callback after the specified delay with trailing option by default', () => {
            const mockFn = vi.fn();
            const debouncedFn = debounce(mockFn, 100);
            debouncedFn('test');

            expect(mockFn).not.toHaveBeenCalled();

            vi.runAllTimers();

            expect(mockFn).toHaveBeenCalledWith('test');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('immediately calls the callback when leading option is true', () => {
            const mockFn = vi.fn();
            const debouncedFn = debounce(mockFn, 100, { leading: true });
            debouncedFn('leading');

            expect(mockFn).toHaveBeenCalledWith('leading');
            expect(mockFn).toHaveBeenCalledTimes(1);

            vi.runAllTimers();

            // Ensure no more calls happen after the timer runs out
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('does not call the callback when trailing is false and leading is not enabled', () => {
            const mockFn = vi.fn();
            const debouncedFn = debounce(mockFn, 100, { trailing: false });
            debouncedFn('noTrailing');

            vi.runAllTimers();

            expect(mockFn).not.toHaveBeenCalled();
        });

        it('throws an error if maxWait is less than waitMs', () => {
            expect(() => debounce(vi.fn(), 100, { maxWait: 50 })).toThrow(
                'Value of maxWait cannot be lower than waitMs.'
            );
        });

        it('calls the callback at maxWait time even if debounced calls continue to occur within waitMs', () => {
            const mockFn = vi.fn();
            const debouncedFn = debounce(mockFn, 100, { maxWait: 200 });

            for (let i = 0; i < 10; i++) {
                debouncedFn(`maxWait-${i}`);
                vi.advanceTimersByTime(50); // Simulate repeated calls within the waitMs
            }

            expect(mockFn).toHaveBeenCalledTimes(2);
            expect(mockFn).toHaveBeenCalledWith('maxWait-3');
            expect(mockFn).toHaveBeenCalledWith('maxWait-7');
        });
    });

    describe('throttle', () => {
        vi.useFakeTimers();

        afterEach(() => {
            vi.clearAllTimers();
        });

        it('calls the function at most once per specified period with both leading and trailing true by default', () => {
            const mockFn = vi.fn();
            const throttledFn = throttle(mockFn, 100);
            throttledFn('first');
            expect(mockFn).toHaveBeenCalledWith('first');
            expect(mockFn).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(50);
            throttledFn('second');
            expect(mockFn).toHaveBeenCalledTimes(1); // No additional call yet

            vi.advanceTimersByTime(50);
            expect(mockFn).toHaveBeenCalledTimes(2); // Trailing call with the last args
            expect(mockFn).toHaveBeenCalledWith('second');
        });

        it('does not call the function immediately when leading is false', () => {
            const mockFn = vi.fn();
            const throttledFn = throttle(mockFn, 100, { leading: false });
            throttledFn('noLead');

            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);

            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('noLead');
        });

        it('does not call the function at the end of the period when trailing is false', () => {
            const mockFn = vi.fn();
            const throttledFn = throttle(mockFn, 100, { trailing: false });
            throttledFn('noTrail');
            expect(mockFn).toHaveBeenCalledWith('noTrail');
            expect(mockFn).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(100);

            // No additional calls should have been made
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });
});
