export type ContinuousDomain<T extends number | Date> = [T, T];

export const NULL_DOMAIN: ContinuousDomain<number> = [Infinity, -Infinity];
export function extendDomain<T extends number | Date>(
    values: T[],
    domain: ContinuousDomain<T> = NULL_DOMAIN as [T, T]
) {
    for (const value of values) {
        if (typeof value !== 'number') {
            continue;
        }

        if (value < domain[0]) {
            domain[0] = value;
        }
        if (value > domain[1]) {
            domain[1] = value;
        }
    }

    return domain;
}
