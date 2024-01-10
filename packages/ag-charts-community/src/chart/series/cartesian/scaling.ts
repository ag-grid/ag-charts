export type Scaling = ContinuousScaling | CategoryScaling | LogScaling;

export interface ContinuousScaling<T = 'continuous'> {
    type: T;
    domain: [number, number];
    range: [number, number];
}

export interface LogScaling extends ContinuousScaling<'log'> {
    convert(domain: number): number;
}

export interface CategoryScaling {
    type: 'category';
    domain: string[];
    range: number[];
}

function isContinuousScaling(scaling: Scaling): scaling is ContinuousScaling {
    return scaling.type === 'continuous' || scaling.type === 'log';
}

function isCategoryScaling(scaling: Scaling): scaling is CategoryScaling {
    return scaling.type === 'category';
}

function areEqual<D, R>(a: { domain: D[]; range: R[] }, b: { domain: D[]; range: R[] }): boolean {
    return (
        a.domain.length === b.domain.length &&
        a.range.length === b.range.length &&
        a.domain.every((val, index) => val === b.domain[index]) &&
        a.range.every((val, index) => val === b.range[index])
    );
}

export function areScalingEqual(a: Scaling | undefined, b: Scaling | undefined): boolean {
    if (a === undefined || b === undefined) {
        return a !== undefined || b !== undefined;
    }
    if (isContinuousScaling(a) && isContinuousScaling(b)) {
        return a.type === b.type && areEqual(a, b);
    }
    if (isCategoryScaling(a) && isCategoryScaling(b)) {
        return areEqual(a, b);
    }
    return false;
}
