import type { AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';

export interface AgCartesianSeriesTooltipRendererParams<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext> {
    /** xKey as specified on series options. */
    readonly xKey: TDatum extends object ? keyof TDatum & string : string;
    /** xName as specified on series options. */
    readonly xName?: string;

    /** yKey as specified on series options. */
    readonly yKey: TDatum extends object ? keyof TDatum & string : string;
    /** yName as specified on series options. */
    readonly yName?: string;
}

export interface AgErrorBoundSeriesTooltipRendererParams<TDatum = TDatumDefault> {
    /** The key to use to retrieve lower bound error values from the x axis data. */
    xLowerKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The x-axis lower bound error value. */
    xLowerValue?: any;
    /** Human-readable description of the lower bound error value for the x axis. This is the value to use in tooltips or labels. */
    xLowerName?: string;
    /** The key to use to retrieve upper bound error values from the x axis data. */
    xUpperKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The x-axis upper bound error value. */
    xUpperValue?: any;
    /** Human-readable description of the upper bound error value for the x axis. This is the value to use in tooltips or labels. */
    xUpperName?: string;

    /** The key to use to retrieve lower bound error values from the y axis data. */
    yLowerKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The y-axis lower bound error value. */
    yLowerValue?: any;
    /** Human-readable description of the lower bound error value for the y axis. This is the value to use in tooltips or labels. */
    yLowerName?: string;
    /** The key to use to retrieve upper bound error values from the y axis data. */
    yUpperKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The y-axis upper bound error value. */
    yUpperValue?: any;
    /** Human-readable description of the upper bound error value for the y axis. This is the value to use in tooltips or labels. */
    yUpperName?: string;
}
