import type { AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { ContextDefault, DatumDefault, ResolvedDatumKey } from '../../chart/types';

export interface AgCartesianSeriesTooltipRendererParams<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgSeriesTooltipRendererParams<TDatum, TContext> {
    /** xKey as specified on series options. */
    readonly xKey: ResolvedDatumKey<TDatum>;
    /** xName as specified on series options. */
    readonly xName?: string;

    /** yKey as specified on series options. */
    readonly yKey: ResolvedDatumKey<TDatum>;
    /** yName as specified on series options. */
    readonly yName?: string;
}

export interface AgErrorBoundSeriesTooltipRendererParams<TDatum = DatumDefault> {
    /** The key to use to retrieve lower bound error values from the x-axis data. */
    xLowerKey?: ResolvedDatumKey<TDatum>;
    /** The x-axis lower bound error value. */
    xLowerValue?: any;
    /** Human-readable description of the lower bound error value for the x-axis. This is the value to use in tooltips or labels. */
    xLowerName?: string;
    /** The key to use to retrieve upper bound error values from the x-axis data. */
    xUpperKey?: ResolvedDatumKey<TDatum>;
    /** The x-axis upper bound error value. */
    xUpperValue?: any;
    /** Human-readable description of the upper bound error value for the x-axis. This is the value to use in tooltips or labels. */
    xUpperName?: string;

    /** The key to use to retrieve lower bound error values from the y-axis data. */
    yLowerKey?: ResolvedDatumKey<TDatum>;
    /** The y-axis lower bound error value. */
    yLowerValue?: any;
    /** Human-readable description of the lower bound error value for the y-axis. This is the value to use in tooltips or labels. */
    yLowerName?: string;
    /** The key to use to retrieve upper bound error values from the y-axis data. */
    yUpperKey?: ResolvedDatumKey<TDatum>;
    /** The y-axis upper bound error value. */
    yUpperValue?: any;
    /** Human-readable description of the upper bound error value for the y-axis. This is the value to use in tooltips or labels. */
    yUpperName?: string;
}
