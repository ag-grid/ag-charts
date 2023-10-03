import type { AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';

export interface AgCartesianSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    /** xKey as specified on series options. */
    readonly xKey: string;
    /** xName as specified on series options. */
    readonly xName?: string;

    /** yKey as specified on series options. */
    readonly yKey: string;
    /** yName as specified on series options. */
    readonly yName?: string;
}
