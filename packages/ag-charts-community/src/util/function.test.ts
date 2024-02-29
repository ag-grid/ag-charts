import { debounce, doOnce, identity, iterate, throttle } from './function';

describe('function utils', () => {
    describe('doOnce', () => {
        beforeEach(() => {
            // Clear the state before each test
            doOnce.clear();
        });

        it('should call a function once per key', () => {
            const mockFn = jest.fn();
            doOnce(mockFn, 'uniqueKey');
            doOnce(mockFn, 'uniqueKey');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should allow different keys to call the function', () => {
            const mockFn = jest.fn();
            doOnce(mockFn, 'key1');
            doOnce(mockFn, 'key2');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('identity', () => {
        it('should return the same value passed in', () => {
            expect(identity(5)).toBe(5);
            expect(identity('test')).toBe('test');
        });
    });

    describe('iterate generator function', () => {
        it('should iterate over multiple arrays', () => {
            const array1 = [1, 2];
            const array2 = ['a', 'b'];
            const array3 = [true, false];
            const combined = [1, 2, 'a', 'b', true, false];

            const iterator = iterate(array1, array2, array3);

            for (let value of combined) {
                expect(iterator.next().value).toBe(value);
            }
        });

        it('should complete iteration when all arrays are exhausted', () => {
            const array1 = [1];
            const array2 = ['a'];

            const iterator = iterate(array1, array2);
            iterator.next(); // 1
            iterator.next(); // 'a'

            expect(iterator.next().done).toBeTruthy();
        });

        it('should handle empty arrays correctly', () => {
            const array1: number[] = [];
            const array2 = [1, 2];
            const array3: number[] = [];

            const iterator = iterate(array1, array2, array3);

            expect(iterator.next().value).toBe(1);
            expect(iterator.next().value).toBe(2);
            expect(iterator.next().done).toBeTruthy();
        });

        it('should handle a single array', () => {
            const array1 = [1, 2, 3];

            const iterator = iterate(array1);

            expect(iterator.next().value).toBe(1);
            expect(iterator.next().value).toBe(2);
            expect(iterator.next().value).toBe(3);
            expect(iterator.next().done).toBeTruthy();
        });

        it('should handle no arrays', () => {
            const iterator = iterate();

            expect(iterator.next().done).toBeTruthy();
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();

        afterEach(() => {
            jest.clearAllTimers();
        });

        it('calls the callback after the specified delay with trailing option by default', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 100);
            debouncedFn('test');

            expect(mockFn).not.toHaveBeenCalled();

            jest.runAllTimers();

            expect(mockFn).toHaveBeenCalledWith('test');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('immediately calls the callback when leading option is true', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 100, { leading: true });
            debouncedFn('leading');

            expect(mockFn).toHaveBeenCalledWith('leading');
            expect(mockFn).toHaveBeenCalledTimes(1);

            jest.runAllTimers();

            // Ensure no more calls happen after the timer runs out
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('does not call the callback when trailing is false and leading is not enabled', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 100, { trailing: false });
            debouncedFn('noTrailing');

            jest.runAllTimers();

            expect(mockFn).not.toHaveBeenCalled();
        });

        it('throws an error if maxWait is less than waitMs', () => {
            expect(() => debounce(jest.fn(), 100, { maxWait: 50 })).toThrow(
                'Value of maxWait cannot be lower than waitMs.'
            );
        });

        it('calls the callback at maxWait time even if debounced calls continue to occur within waitMs', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 100, { maxWait: 200 });

            for (let i = 0; i < 10; i++) {
                debouncedFn(`maxWait-${i}`);
                jest.advanceTimersByTime(50); // Simulate repeated calls within the waitMs
            }

            expect(mockFn).toHaveBeenCalledTimes(2);
            expect(mockFn).toHaveBeenCalledWith('maxWait-3');
            expect(mockFn).toHaveBeenCalledWith('maxWait-7');
        });
    });

    describe('throttle', () => {
        jest.useFakeTimers();

        afterEach(() => {
            jest.clearAllTimers();
        });

        it('calls the function at most once per specified period with both leading and trailing true by default', () => {
            const mockFn = jest.fn();
            const throttledFn = throttle(mockFn, 100);
            throttledFn('first');
            expect(mockFn).toHaveBeenCalledWith('first');
            expect(mockFn).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(50);
            throttledFn('second');
            expect(mockFn).toHaveBeenCalledTimes(1); // No additional call yet

            jest.advanceTimersByTime(50);
            expect(mockFn).toHaveBeenCalledTimes(2); // Trailing call with the last args
            expect(mockFn).toHaveBeenCalledWith('second');
        });

        it('does not call the function immediately when leading is false', () => {
            const mockFn = jest.fn();
            const throttledFn = throttle(mockFn, 100, { leading: false });
            throttledFn('noLead');

            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('noLead');
        });

        it('does not call the function at the end of the period when trailing is false', () => {
            const mockFn = jest.fn();
            const throttledFn = throttle(mockFn, 100, { trailing: false });
            throttledFn('noTrail');
            expect(mockFn).toHaveBeenCalledWith('noTrail');
            expect(mockFn).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(100);

            // No additional calls should have been made
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });
});
