export function convertDomain(
    n: number,
    [d0, d1]: [number, number] | number[],
    [r0, r1]: [number, number] | number[],
    clamp?: boolean
) {
    if (d0 === d1) {
        return (r0 + r1) / 2;
    } else if (n === d0) {
        return r0;
    } else if (n === d1) {
        return r1;
    }

    if (clamp) {
        if (n < d0) {
            return r0;
        } else if (n > d1) {
            return r1;
        }
    }

    return r0 + ((n - d0) / (d1 - d0)) * (r1 - r0);
}

export function niceDomain(
    domain: number[],
    options: { floor: (n: number) => number; ceil: (n: number) => number } = Math
) {
    const d = [...domain];

    if (d.length === 0) {
        d.push(0, 1);
    } else if (d.length === 1) {
        d.push(d[0]);
    }

    const i = d.length - 1;
    d[0] = options.floor(d[0]);
    d[i] = options.ceil(d[i]);
    d[i] += 0; // add 0 to convert -0 into 0
    return d;
}
