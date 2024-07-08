import { describe, expect, it } from '@jest/globals';

import { expectWarningsCalls, setupMockConsole } from '../../chart/test/utils';
import { isPlainObject } from '../../util/type-guards';
import type { MementoOriginator } from './memento';
import { MementoCaretaker } from './memento';

describe('Memento Caretaker', () => {
    setupMockConsole();

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

        guardMemento(blob: unknown): blob is TestMemento {
            return isPlainObject(blob) && 'type' in blob && blob.type === 'test';
        }

        restoreMemento(version: string, mementoVersion: string, blob: TestMemento): void {
            if (version === mementoVersion) {
                this.restored = blob.data;
            } else {
                this.restored = (blob as any).old;
            }
        }
    }

    let originator: TestOriginator;
    let caretaker: MementoCaretaker;

    beforeEach(() => {
        originator = new TestOriginator();
        caretaker = new MementoCaretaker('10.0.0');
    });

    it('should save and restore data', () => {
        originator.data = { hello: 'world' };

        const blob = caretaker.save(originator);
        caretaker.restore(blob, originator);

        expect(blob).toStrictEqual({ version: '10.0.0', test: { data: { hello: 'world' }, type: 'test' } });
        expect(originator.restored).toStrictEqual({ hello: 'world' });
    });

    it('should save and restore data with unicode strings', () => {
        originator.data = { hello: '🌍' };

        const blob = caretaker.save(originator);
        caretaker.restore(blob, originator);

        expect(blob).toStrictEqual({ version: '10.0.0', test: { data: { hello: '🌍' }, type: 'test' } });
        expect(originator.restored).toStrictEqual({ hello: '🌍' });
    });

    it('should save and restore data with dates', () => {
        originator.data = { hello: 'world', time: new Date(2024, 0, 1) };

        const blob = caretaker.save(originator);
        caretaker.restore(blob, originator);

        expect(blob).toStrictEqual({
            version: '10.0.0',
            test: {
                data: {
                    hello: 'world',
                    time: { __type: 'date', value: 'Mon Jan 01 2024 00:00:00 GMT+0000 (Greenwich Mean Time)' },
                },
                type: 'test',
            },
        });
        expect(originator.restored).toStrictEqual({ hello: 'world', time: new Date(2024, 0, 1) });
    });

    it('should migrate older versioned mementos', () => {
        caretaker.restore(
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
        caretaker.restore(blob, originator);

        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Could not restore [test] data, value was invalid, ignoring.",
    {
      "data": {
        "hello": "world",
      },
      "type": "other-test",
    },
  ],
]
`);
        expect(originator.restored).toBeUndefined();
    });

    it('should handle invalid blobs', () => {
        caretaker.restore(null, originator);
        caretaker.restore('invalid', originator);
        caretaker.restore({ some: 'nonsense' }, originator);
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Could not restore data of type [null], expecting an object, ignoring.",
  ],
  [
    "AG Charts - Could not restore data of type [string], expecting an object, ignoring.",
  ],
  [
    "AG Charts - Could not restore data, missing [version] string in object, ignoring.",
  ],
]
`);
    });

    it('should handle an invalid memento', () => {
        caretaker.restore({ version: '10.0.0', test: { type: 'invalid' } }, originator);
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Could not restore [test] data, value was invalid, ignoring.",
    {
      "type": "invalid",
    },
  ],
]
`);
    });

    it('should ignore an unknown memento', () => {
        caretaker.restore({ version: '10.0.0', invalid: 'invalid' }, originator);
        expect(originator.restored).toBeUndefined();
    });
});
