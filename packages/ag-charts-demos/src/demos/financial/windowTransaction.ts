import { type AgDataTransaction } from 'ag-charts-community';

// Diff two ordered windows of an incrementally-streamed chart into the minimal set
// of data transactions needed to turn `prev` into `next`. Both windows are trailing
// slices of the same growing series, so retained items always form one contiguous
// run: additions sit at the front (window grew leftwards) and/or the back (a fresh
// point streamed in), never in the interior.
//
// Items are matched by the id returned from `idOf`, which must line up with the
// chart's `dataIdKey`. `valueEquals`, when supplied, flags a retained item whose
// content changed so it is re-emitted as an `update` (the id is stable but the datum
// is replaced) — omit it for series whose data points are immutable once created.
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
