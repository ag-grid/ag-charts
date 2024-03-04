import { type List, insertManySorted } from './linkedList';

const toArray = <T>(list: List<T>): T[] => {
    const out: T[] = [];
    for (let current = list; current != null; current = current.next) {
        out.push(current.value);
    }
    return out;
};

describe('linkedList', () => {
    describe('#insertManySorted', () => {
        it('should insert multiple items from a sorted array', () => {
            const result = insertManySorted(
                { value: 3, next: { value: 5, next: { value: 8, next: null } } },
                [1, 2, 3, 4, 5, 6, 7, 8, 9],
                (a, b) => a - b
            );

            expect(toArray(result)).toEqual([1, 2, 3, 3, 4, 5, 5, 6, 7, 8, 8, 9]);
        });
    });
});
