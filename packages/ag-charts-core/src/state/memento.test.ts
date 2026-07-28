import { describe, expect, it, vi } from 'vitest';

import { Logger } from '../logging/logger';
import * as ambientLog from '../logging/logger';
import { isPlainObject } from '../utils/types/typeGuards';
import { MementoCaretaker, type MementoOriginator } from './memento';

describe('Memento Caretaker', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => void 0);
        vi.spyOn(console, 'error').mockImplementation(() => void 0);
        vi.spyOn(console, 'trace').mockImplementation(() => void 0);
        vi.spyOn(console, 'debug').mockImplementation(() => void 0);
        vi.spyOn(console, 'info').mockImplementation(() => void 0);
        vi.spyOn(console, 'log').mockImplementation(() => void 0);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    class TestMemento {
        type = 'test';
        constructor(public readonly data?: any) {}
    }

    class TestOriginator implements MementoOriginator<TestMemento> {
        mementoOriginatorKey = 'test';
        data?: object;
        restored?: object;

        createMemento() {
            return new TestMemento(this.data);
        }

        guardMemento(blob: unknown): blob is TestMemento | undefined {
            return blob == null || (isPlainObject(blob) && 'type' in blob && blob.type === 'test');
        }

        restoreMemento(version: string, mementoVersion: string, blob: TestMemento | undefined): void {
            if (blob == null) return;

            if (version === mementoVersion) {
                this.restored = blob.data;
            } else {
                this.restored = (blob as any).old;
            }
        }
    }

    let originator: TestOriginator;
    let caretaker: MementoCaretaker;
    const mementoLogger = new Logger();

    beforeEach(() => {
        originator = new TestOriginator();
        caretaker = new MementoCaretaker('10.0.0');
        ambientLog.reset();
        mementoLogger.reset();
    });

    it('should save and restore data', () => {
        originator.data = { hello: 'world' };

        const blob = caretaker.save(originator);
        caretaker.restore(mementoLogger, blob, originator);

        expect(blob).toStrictEqual({ version: '10.0.0', test: { data: { hello: 'world' }, type: 'test' } });
        expect(originator.restored).toStrictEqual({ hello: 'world' });
    });

    it('should save and restore data with unicode strings', () => {
        originator.data = { hello: '🌍' };

        const blob = caretaker.save(originator);
        caretaker.restore(mementoLogger, blob, originator);

        expect(blob).toStrictEqual({ version: '10.0.0', test: { data: { hello: '🌍' }, type: 'test' } });
        expect(originator.restored).toStrictEqual({ hello: '🌍' });
    });

    it('should save and restore data with dates', () => {
        originator.data = { hello: 'world', time: new Date(2024, 0, 1) };

        const blob = caretaker.save(originator);
        caretaker.restore(mementoLogger, blob, originator);

        expect(blob).toStrictEqual({
            version: '10.0.0',
            test: {
                data: {
                    hello: 'world',
                    time: { __type: 'date', value: '2024-01-01T00:00:00.000Z' },
                },
                type: 'test',
            },
        });
        expect(originator.restored).toStrictEqual({ hello: 'world', time: new Date(2024, 0, 1) });

        const blobDateTypes = {
            version: '10.0.0',
            test: {
                data: {
                    longString: {
                        __type: 'date',
                        value: 'Mon Jan 01 2024 00:00:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    isoString: { __type: 'date', value: '2024-01-01T00:00:00.000Z' },
                    timestamp: { __type: 'date', value: 1704067200000 },
                },
                type: 'test',
            },
        };

        caretaker.restore(mementoLogger, blobDateTypes, originator);
        expect(originator.restored).toStrictEqual({
            longString: new Date(2024, 0, 1),
            isoString: new Date(2024, 0, 1),
            timestamp: new Date(2024, 0, 1),
        });
    });

    it('should save and restore data with bigints', () => {
        const bigValue = 9007199254740993n; // Number.MAX_SAFE_INTEGER + 2, beyond Number precision.
        originator.data = { hello: 'world', count: bigValue };

        const blob = caretaker.save(originator);
        caretaker.restore(mementoLogger, blob, originator);

        expect(blob).toStrictEqual({
            version: '10.0.0',
            test: {
                data: {
                    hello: 'world',
                    count: { __type: 'bigint', value: '9007199254740993' },
                },
                type: 'test',
            },
        });
        expect(originator.restored).toStrictEqual({ hello: 'world', count: bigValue });
    });

    it('should not throw on a malformed bigint payload and leave it un-decoded', () => {
        const blobMalformedBigInt = {
            version: '10.0.0',
            test: {
                data: {
                    fractional: { __type: 'bigint', value: '12.3' },
                    nonString: { __type: 'bigint', value: 5 },
                },
                type: 'test',
            },
        };

        caretaker.restore(mementoLogger, blobMalformedBigInt, originator);
        // Mirrors invalid-date handling: the payload flows through guardMemento rather than aborting.
        expect(originator.restored).toStrictEqual({
            fractional: { __type: 'bigint', value: '12.3' },
            nonString: { __type: 'bigint', value: 5 },
        });
    });

    it('should migrate older versioned mementos', () => {
        caretaker.restore(
            mementoLogger,
            {
                version: '9.3.0',
                test: {
                    // "old" memento stores data in 'old' instead of 'data'
                    old: { hello: 'world' },
                    type: 'test',
                },
            },
            originator
        );
        expect(originator.restored).toStrictEqual({ hello: 'world' });
    });

    it('should guard an incorrect memento', () => {
        class OtherTestMemento extends TestMemento {
            override type = 'other-test';
        }

        class OtherTestOriginator extends TestOriginator {
            override mementoOriginatorKey = 'test';

            override createMemento() {
                return new OtherTestMemento(this.data);
            }

            override guardMemento(blob: unknown): blob is OtherTestMemento {
                return isPlainObject(blob) && 'type' in blob && blob.type === 'other-test';
            }
        }

        const otherOriginator = new OtherTestOriginator();
        otherOriginator.data = { hello: 'world' };

        const blob = caretaker.save(otherOriginator);
        caretaker.restore(mementoLogger, blob, originator);

        expect(console.warn).toHaveBeenCalledWith(
            'AG Charts - Could not restore [test] data, value was invalid, ignoring.',
            {
                data: {
                    hello: 'world',
                },
                type: 'other-test',
            }
        );
        expect(originator.restored).toBeUndefined();
    });

    it('should handle invalid blobs', () => {
        caretaker.restore(mementoLogger, null, originator);
        caretaker.restore(mementoLogger, 'invalid', originator);
        caretaker.restore(mementoLogger, { some: 'nonsense' }, originator);
        expect(console.warn).toHaveBeenCalledWith(
            'AG Charts - Could not restore data of type [null], expecting an object, ignoring.'
        );
        expect(console.warn).toHaveBeenCalledWith(
            'AG Charts - Could not restore data of type [string], expecting an object, ignoring.'
        );
        expect(console.warn).toHaveBeenCalledWith(
            'AG Charts - Could not restore data, missing [version] string in object, ignoring.'
        );
    });

    it('should handle an invalid memento', () => {
        caretaker.restore(mementoLogger, { version: '10.0.0', test: { type: 'invalid' } }, originator);
        expect(console.warn).toHaveBeenCalledWith(
            'AG Charts - Could not restore [test] data, value was invalid, ignoring.',
            {
                type: 'invalid',
            }
        );
        expect(originator.restored).toBeUndefined();
    });

    it('should ignore an unknown memento', () => {
        caretaker.restore(mementoLogger, { version: '10.0.0', invalid: 'invalid' }, originator);
        expect(originator.restored).toBeUndefined();
    });
});
