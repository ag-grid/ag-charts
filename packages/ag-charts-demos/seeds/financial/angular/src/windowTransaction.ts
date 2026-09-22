import { type AgDataTransaction } from 'ag-charts-community';

// Both are trailing slices of one growing series, so additions only ever sit at the front or back.
// `idOf` must line up with the chart's `dataIdKey`.
export function diffWindow<T>(
    prev: readonly T[],
    next: readonly T[],
    idOf: (item: T) => string | number,
    valueEquals?: (a: T, b: T) => boolean
): AgDataTransaction<T>[] {
    const prevById = new Map(prev.map((item) => [idOf(item), item]));
    const nextIds = new Set(next.map(idOf));

    const remove = prev.filter((item) => !nextIds.has(idOf(item)));
    const frontAdds: T[] = [];
    const backAdds: T[] = [];
    const update: T[] = [];

    let seenRetained = false;
    for (const item of next) {
        const previous = prevById.get(idOf(item));
        if (previous === undefined) {
            (seenRetained ? backAdds : frontAdds).push(item);
        } else {
            seenRetained = true;
            if (valueEquals && !valueEquals(previous, item)) update.push(item);
        }
    }

    const transactions: AgDataTransaction<T>[] = [];
    if (remove.length || update.length || backAdds.length) {
        const transaction: AgDataTransaction<T> = {};
        if (remove.length) transaction.remove = remove;
        if (update.length) transaction.update = update;
        if (backAdds.length) transaction.add = backAdds;
        transactions.push(transaction);
    }
    if (frontAdds.length) transactions.push({ add: frontAdds, addIndex: 0 });
    return transactions;
}
