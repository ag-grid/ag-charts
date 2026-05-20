import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReactiveState } from './reactiveState';

describe('ReactiveState', () => {
    type TestState = { count: number; name: string; flag: boolean };
    let state: ReactiveState<TestState>;

    beforeEach(() => {
        state = new ReactiveState<TestState>();
    });

    describe('getValue / setValue', () => {
        it('returns undefined for unset keys', () => {
            expect(state.getValue('count')).toBeUndefined();
        });

        it('applies values immediately after setValue', () => {
            state.setValue('count', 42);
            expect(state.getValue('count')).toBe(42);
        });

        it('applies values after flush', () => {
            state.setValue('count', 42);
            state.flushChanges();
            expect(state.getValue('count')).toBe(42);
        });
    });

    describe('observe', () => {
        it('calls observer on registration', () => {
            const observer = vi.fn();
            state.observe(observer);
            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('notifies observer when an observed key changes', () => {
            const observer = vi.fn((get: (key: keyof TestState) => unknown) => get('count'));
            state.observe(observer);
            observer.mockClear();

            state.setValue('count', 1);
            state.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('does not notify observer for unobserved keys', () => {
            const observer = vi.fn((get: (key: keyof TestState) => unknown) => get('count'));
            state.observe(observer);
            observer.mockClear();

            state.setValue('name', 'hello');
            state.flushChanges();

            expect(observer).not.toHaveBeenCalled();
        });

        it('does not notify observer when value is unchanged', () => {
            state.setValue('count', 5);
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof TestState) => unknown) => get('count'));
            state.observe(observer);
            observer.mockClear();

            state.setValue('count', 5);
            state.flushChanges();

            expect(observer).not.toHaveBeenCalled();
        });

        it('unsubscribe stops notifications', () => {
            const observer = vi.fn((get: (key: keyof TestState) => unknown) => get('count'));
            const unsubscribe = state.observe(observer);
            observer.mockClear();

            unsubscribe();
            state.setValue('count', 1);
            state.flushChanges();

            expect(observer).not.toHaveBeenCalled();
        });

        it('deduplicates notifications per flush when multiple observed keys change', () => {
            type MultiState = { a: number; b: number };
            const multiState = new ReactiveState<MultiState>();
            const observer = vi.fn((get: (key: keyof MultiState) => unknown) => {
                get('a');
                get('b');
            });
            multiState.observe(observer);
            observer.mockClear();

            multiState.setValue('a', 1);
            multiState.setValue('b', 2);
            multiState.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('provides current values via valueGetter on registration', () => {
            state.setValue('count', 10);
            state.flushChanges();

            let observedValue: number | undefined;
            state.observe((get) => {
                observedValue = get('count');
            });

            expect(observedValue).toBe(10);
        });
    });

    describe('flushChanges', () => {
        it('preserves setValue calls made during flush for the next flush', () => {
            const observer = vi.fn((get: (key: keyof TestState) => unknown) => {
                const value = get('count');
                if (value === 1) {
                    state.setValue('count', 2);
                }
            });
            state.observe(observer);
            observer.mockClear();

            state.setValue('count', 1);
            state.flushChanges();

            // setValue during flush is immediately readable
            expect(state.getValue('count')).toBe(2);

            // observer notified again on next flush for the deferred 1→2 change
            state.flushChanges();

            expect(state.getValue('count')).toBe(2);
        });

        it('re-entrant flushChanges is a no-op', () => {
            let innerFlushCalled = false;
            const observer = vi.fn((get: (key: keyof TestState) => unknown) => {
                get('count');
                if (!innerFlushCalled) {
                    innerFlushCalled = true;
                    state.flushChanges();
                }
            });
            state.observe(observer);
            observer.mockClear();

            state.setValue('count', 1);
            state.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('provides current (post-change) values via valueGetter during notification', () => {
            let valueSeenDuringFlush: number | undefined;
            state.observe((get) => {
                get('name');
                valueSeenDuringFlush = get('count');
            });

            state.setValue('name', 'test');
            state.setValue('count', 99);
            state.flushChanges();

            expect(valueSeenDuringFlush).toBe(99);
        });
    });

    describe('destroy', () => {
        it('clears all state', () => {
            state.setValue('count', 5);
            state.flushChanges();

            state.destroy();

            expect(state.getValue('count')).toBeUndefined();
        });

        it('stops observer notifications after destroy', () => {
            const observer = vi.fn((get: (key: keyof TestState) => unknown) => get('count'));
            state.observe(observer);
            observer.mockClear();

            state.destroy();
            state.setValue('count', 10);
            state.flushChanges();

            expect(observer).not.toHaveBeenCalled();
        });

        it('discards pending changes', () => {
            state.setValue('count', 42);
            state.destroy();
            state.flushChanges();

            expect(state.getValue('count')).toBeUndefined();
        });
    });

    describe('errors', () => {
        it('propagates observer errors instead of swallowing them', () => {
            const error = new Error('observer error');
            const observer = vi.fn((get: (key: keyof TestState) => unknown) => {
                get('count');
            });
            state.observe(observer);
            observer.mockImplementation(() => {
                throw error;
            });

            state.setValue('count', 1);

            expect(() => state.flushChanges()).toThrow(error);
        });
    });
});

describe('ReactiveState — nested path observation', () => {
    type NestedState = {
        options: { legend: { enabled: boolean }; title: { text: string } };
        width: number;
    };
    let state: ReactiveState<NestedState>;

    beforeEach(() => {
        state = new ReactiveState<NestedState>();
    });

    describe('getValue nested', () => {
        it('returns correct nested value', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();
            expect(state.getValue('options', 'legend.enabled')).toBe(true);
            expect(state.getValue('options', 'title.text')).toBe('hello');
        });

        it('returns undefined for missing path', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();
            expect(state.getValue('options', 'legend.missing' as any)).toBeUndefined();
            expect(state.getValue('options', 'nonexistent' as any)).toBeUndefined();
        });
    });

    describe('observe', () => {
        it('observer receives value on registration', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            let observedValue: unknown;
            state.observe((get) => {
                observedValue = get('options', 'legend.enabled');
            });

            expect(observedValue).toBe(true);
        });

        it('notified when its path changes', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState, subPath?: string) => unknown) => {
                get('options', 'legend.enabled');
            });
            state.observe(observer);
            observer.mockClear();

            state.setValue('options', { legend: { enabled: false }, title: { text: 'hello' } });
            state.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('NOT notified when a sibling path changes', () => {
            const initialOptions = { legend: { enabled: true }, title: { text: 'hello' } };
            state.setValue('options', initialOptions);
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState, subPath?: string) => unknown) => {
                get('options', 'legend.enabled');
            });
            state.observe(observer);
            observer.mockClear();

            // Spread keeps the same legend reference; only title changes
            state.setValue('options', { ...initialOptions, title: { text: 'changed' } });
            state.flushChanges();

            expect(observer).not.toHaveBeenCalled();
        });

        it('whole-key observer notified for any nested change', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState) => unknown) => {
                get('options');
            });
            state.observe(observer);
            observer.mockClear();

            state.setValue('options', { legend: { enabled: false }, title: { text: 'hello' } });
            state.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('not notified when nested value is unchanged despite new object reference', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState, subPath?: string) => unknown) => {
                get('options', 'legend.enabled');
            });
            state.observe(observer);
            observer.mockClear();

            // New object reference, same structural values
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            expect(observer).not.toHaveBeenCalled();
        });

        it('notified when parent path is entirely replaced', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState, subPath?: string) => unknown) => {
                get('options', 'legend.enabled');
            });
            state.observe(observer);
            observer.mockClear();

            // Replace legend with a non-object — child path implicitly changed
            state.setValue('options', { legend: null as any, title: { text: 'hello' } });
            state.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('deduplication: called once when multiple tracked paths both change', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState, subPath?: string) => unknown) => {
                get('options', 'legend.enabled');
                get('options', 'title.text');
            });
            state.observe(observer);
            observer.mockClear();

            state.setValue('options', { legend: { enabled: false }, title: { text: 'changed' } });
            state.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('mixed flat + nested: observer for both a flat key and a nested path works correctly', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.setValue('width', 800);
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState, subPath?: string) => unknown) => {
                get('width');
                get('options', 'legend.enabled');
            });
            state.observe(observer);
            observer.mockClear();

            // Change only width
            state.setValue('width', 1000);
            state.flushChanges();
            expect(observer).toHaveBeenCalledTimes(1);

            observer.mockClear();

            // Change only options.legend.enabled
            state.setValue('options', { legend: { enabled: false }, title: { text: 'hello' } });
            state.flushChanges();
            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('unsubscribe stops nested notifications', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState, subPath?: string) => unknown) => {
                get('options', 'legend.enabled');
            });
            const unsubscribe = state.observe(observer);
            observer.mockClear();

            unsubscribe();

            state.setValue('options', { legend: { enabled: false }, title: { text: 'hello' } });
            state.flushChanges();

            expect(observer).not.toHaveBeenCalled();
        });

        it('notified when value changes from object to primitive', () => {
            state.setValue('options', { legend: { enabled: true }, title: { text: 'hello' } });
            state.flushChanges();

            const observer = vi.fn((get: (key: keyof NestedState, subPath?: string) => unknown) => {
                get('options', 'legend.enabled');
            });
            state.observe(observer);
            observer.mockClear();

            state.setValue('options', null as any);
            state.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });
    });

    describe('arrays as opaque', () => {
        it('any array element change notifies observers of that array path', () => {
            type ArrayState = { data: { items: number[] } };
            const arrState = new ReactiveState<ArrayState>();
            arrState.setValue('data', { items: [1, 2, 3] });
            arrState.flushChanges();

            const observer = vi.fn((get: (key: keyof ArrayState, subPath?: string) => unknown) => {
                get('data', 'items');
            });
            arrState.observe(observer);
            observer.mockClear();

            arrState.setValue('data', { items: [1, 2, 4] });
            arrState.flushChanges();

            expect(observer).toHaveBeenCalledTimes(1);
        });

        it('not notified when array is the same reference', () => {
            type ArrayState = { data: { items: number[] } };
            const arrState = new ReactiveState<ArrayState>();
            const items = [1, 2, 3];
            arrState.setValue('data', { items });
            arrState.flushChanges();

            const observer = vi.fn((get: (key: keyof ArrayState, subPath?: string) => unknown) => {
                get('data', 'items');
            });
            arrState.observe(observer);
            observer.mockClear();

            // Same array reference: no change
            arrState.setValue('data', { items });
            arrState.flushChanges();

            expect(observer).not.toHaveBeenCalled();
        });
    });
});
