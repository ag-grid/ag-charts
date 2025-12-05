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

/** Standard category scaling with full domain array */
export interface StandardCategoryScaling {
    type: 'category';
    domain: readonly string[] | readonly Date[];
    inset: number;
    step: number;
}

/** Optimized scaling for unit-time with O(1) numeric metadata instead of full domain array */
export interface UnitTimeCategoryScaling {
    type: 'category';
    variant: 'unit-time';
    firstBandTime: number;
    lastBandTime: number;
    bandCount: number;
    intervalMs: number;
    inset: number;
    step: number;
}

export type CategoryScaling = StandardCategoryScaling | UnitTimeCategoryScaling;

function isContinuousScaling(scaling: Scaling): scaling is ContinuousScaling {
    return scaling.type === 'continuous' || scaling.type === 'log';
}

function isCategoryScaling(scaling: Scaling): scaling is CategoryScaling {
    return scaling.type === 'category';
}

export function isUnitTimeCategoryScaling(scaling: CategoryScaling): scaling is UnitTimeCategoryScaling {
    return 'variant' in scaling && scaling.variant === 'unit-time';
}

function isStandardCategoryScaling(scaling: CategoryScaling): scaling is StandardCategoryScaling {
    return !('variant' in scaling);
}

export function areScalingEqual(a: Scaling | undefined, b: Scaling | undefined): boolean {
    if (a === undefined || b === undefined) {
        return a !== undefined || b !== undefined;
    }
    if (isContinuousScaling(a) && isContinuousScaling(b)) {
        return a.type === b.type && arraysEqual(a.domain, b.domain) && arraysEqual(a.range, b.range);
    }
    if (isCategoryScaling(a) && isCategoryScaling(b)) {
        // O(1) comparison for unit-time scaling
        if (isUnitTimeCategoryScaling(a) && isUnitTimeCategoryScaling(b)) {
            return (
                a.firstBandTime === b.firstBandTime &&
                a.lastBandTime === b.lastBandTime &&
                a.bandCount === b.bandCount &&
                a.intervalMs === b.intervalMs &&
                a.inset === b.inset &&
                a.step === b.step
            );
        }

        // Standard category comparison (O(n))
        if (isStandardCategoryScaling(a) && isStandardCategoryScaling(b)) {
            return a.inset === b.inset && a.step === b.step && arraysEqual(a.domain, b.domain);
        }

        // Different variants are not equal
        return false;
    }
    return false;
}

export function isScaleValid(scale?: Scaling) {
    if (scale == null) return false;
    if (scale.type === 'category') {
        // O(1) validation for unit-time scaling
        if (isUnitTimeCategoryScaling(scale)) {
            return (
                Number.isFinite(scale.firstBandTime) &&
                Number.isFinite(scale.lastBandTime) &&
                Number.isFinite(scale.bandCount) &&
                scale.bandCount > 0
            );
        }
        // Standard category validation (O(n))
        return scale.domain.every((v: any) => v != null);
    }
    return (
        scale.domain.every((v: any) => Number.isFinite(v) || v instanceof Date) &&
        scale.range.every((v) => Number.isFinite(v))
    );
}
