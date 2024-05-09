import { describe, expect, it } from '@jest/globals';

import { isPlainObject } from '../util/type-guards';
import { Memento, MementoCaretaker, MementoOriginator } from './memento';
import { expectWarning, setupMockConsole } from './test/utils';

describe('Memento Caretaker', () => {
    setupMockConsole();

    class TestMemento implements Memento {
        type = 'test';
        version = 10;

        constructor(public readonly data?: any) {}
    }

    class TestOriginator implements MementoOriginator {
        mementoOriginatorName = 'TestOriginator';
        data?: any;
        restored?: any;

        createMemento() {
            return new TestMemento(this.data);
        }

        guardMemento(blob: unknown): boolean {
            return isPlainObject(blob) && 'type' in blob && blob.type === 'test';
        }

        restoreMemento(blob: TestMemento): void {
            this.restored = blob.data;
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
        caretaker.restore(originator, blob);

        expect(blob).toBe('eyJkYXRhIjp7ImhlbGxvIjoid29ybGQifSwidHlwZSI6InRlc3QiLCJ2ZXJzaW9uIjoxMH0=');
        expect(originator.restored).toEqual({ hello: 'world' });
    });

    it('should save and restore data with unicode strings', () => {
        originator.data = { hello: '🌍' };

        const blob = caretaker.save(originator);
        caretaker.restore(originator, blob);

        expect(blob).toBe('eyJkYXRhIjp7ImhlbGxvIjoi8J+MjSJ9LCJ0eXBlIjoidGVzdCIsInZlcnNpb24iOjEwfQ==');
        expect(originator.restored).toEqual({ hello: '🌍' });
    });

    it('should guard an incorrect memento', () => {
        class OtherTestMemento extends TestMemento {
            override type = 'other-test';
        }

        class OtherTestOriginator extends TestOriginator {
            override mementoOriginatorName = 'OtherTestOriginator';

            override createMemento() {
                return new OtherTestMemento(this.data);
            }

            override guardMemento(blob: unknown): boolean {
                return isPlainObject(blob) && 'type' in blob && blob.type === 'other-test';
            }
        }

        const otherOriginator = new OtherTestOriginator();
        otherOriginator.data = { hello: 'world' };

        const blob = caretaker.save(otherOriginator);
        caretaker.restore(originator, blob);

        expectWarning('AG Charts - TestOriginator - Could not restore data, memento was invalid, ignoring.', {
            data: otherOriginator.data,
            type: 'other-test',
            version: 10,
        });
        expect(originator.restored).toBeUndefined();
    });

    it('should handle an invalid memento', () => {
        expect(() => caretaker.restore(originator, 'some nonsense')).toThrow();
        expect(originator.restored).toBeUndefined();
    });
});
