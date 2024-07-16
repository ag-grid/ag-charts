import type { ModuleContext } from '../../module/moduleContext';
import { BandScale } from '../../scale/bandScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';
export declare class CategoryAxisTick<S extends BandScale<string | object, number> | OrdinalTimeScale = BandScale<string | object, number>> extends AxisTick<S> {
    minSpacing: number;
}
export declare class CategoryAxis<S extends BandScale<string | object, number> | OrdinalTimeScale = BandScale<string | object, number>> extends CartesianAxis<S> {
    static readonly className: string;
    static readonly type: 'category' | 'ordinal-time';
    private _paddingOverrideEnabled;
    constructor(moduleCtx: ModuleContext, scale?: S);
    groupPaddingInner: number;
    set paddingInner(value: number);
    get paddingInner(): number;
    set paddingOuter(value: number);
    get paddingOuter(): number;
    protected createTick(): AxisTick<S, any, any>;
    normaliseDataDomain(d: (string | object)[]): {
        domain: (string | object)[];
        clipped: boolean;
    };
    protected calculateDomain(): void;
}
