import { arraysEqual } from './arrays';

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
    domain: readonly string[] | readonly Date[];
    inset: number;
    step: number;
}

function isContinuousScaling(scaling: Scaling): scaling is ContinuousScaling {
    return scaling.type === 'continuous' || scaling.type === 'log';
}

function isCategoryScaling(scaling: Scaling): scaling is CategoryScaling {
    return scaling.type === 'category';
}

export function areScalingEqual(a: Scaling | undefined, b: Scaling | undefined): boolean {
    if (a === undefined || b === undefined) {
        return a !== undefined || b !== undefined;
    }
    if (isContinuousScaling(a) && isContinuousScaling(b)) {
        return a.type === b.type && arraysEqual(a.domain, b.domain) && arraysEqual(a.range, b.range);
    }
    if (isCategoryScaling(a) && isCategoryScaling(b)) {
        return a.inset === b.inset && a.step === b.step && arraysEqual(a.domain, b.domain);
    }
    return false;
}

export function isScaleValid(scale?: Scaling) {
    if (scale == null) return false;
    if (scale.type === 'category') return scale.domain.every((v: any) => v != null);
    return (
        scale.domain.every((v: any) => Number.isFinite(v) || v instanceof Date) &&
        scale.range.every((v) => Number.isFinite(v))
    );
}
