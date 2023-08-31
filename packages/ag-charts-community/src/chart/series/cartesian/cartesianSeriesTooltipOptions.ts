import type { AgSeriesTooltipRendererParams } from '../../options/tooltipOptions';

export interface AgCartesianSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    /** xKey as specified on series options. */
    readonly xKey: string;
    /** xValue as read from series data via the xKey property. */
    readonly xValue?: any;
    /** xName as specified on series options. */
    readonly xName?: string;

    /** yKey as specified on series options. */
    readonly yKey: string;
    /** yValue as read from series data via the yKey property. */
    readonly yValue?: any;
    /** yName as specified on series options. */
    readonly yName?: string;
}
