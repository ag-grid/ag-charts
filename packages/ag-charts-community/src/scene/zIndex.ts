export type ZIndex = number | number[];

type CompareResult = -1 | 0 | 1;
const cmp = (a: number, b: number): CompareResult => Math.sign(a - b) as CompareResult;

export function compareZIndex(a: ZIndex, b: ZIndex): CompareResult {
    if (typeof a === 'number' && typeof b === 'number') {
        return cmp(a, b);
    }

    const aArray = typeof a === 'number' ? [a] : a;
    const bArray = typeof b === 'number' ? [b] : b;

    const length = Math.min(aArray.length, bArray.length);
    for (let i = 0; i < length; i += 1) {
        const diff = cmp(aArray[i], bArray[i]);
        if (diff !== 0) return diff;
    }

    return cmp(aArray.length, bArray.length);
}
