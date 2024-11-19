export function compareDates(a: Date, b: Date) {
    return a.valueOf() - b.valueOf();
}

function deduplicateSortedArray(values: Date[]) {
    let v0 = NaN;
    const out: Date[] = [];
    for (const v of values) {
        const v1 = v.valueOf();
        if (v0 !== v1) out.push(v);
        v0 = v1;
    }
    return out;
}

export function sortAndUniqueDates(values: Date[]) {
    const sortedValues = values.slice().sort(compareDates);
    return datesSortOrder(values) == null ? deduplicateSortedArray(sortedValues) : sortedValues;
}

export function datesSortOrder(d: Date[]): 1 | -1 | undefined {
    if (d.length === 0) return 1;

    const sign: 1 | -1 = Number(d[d.length - 1]) > Number(d[0]) ? 1 : -1;
    let v0 = -Infinity * sign;
    for (const v of d) {
        const v1 = v.valueOf();
        if (Math.sign(v1 - v0) !== sign) return;
        v0 = v1;
    }
    return sign;
}
