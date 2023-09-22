import type { AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';

export interface AgPolarSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    /** angleKey as specified on series options. */
    readonly angleKey: string;
    /** angleValue as read from series data via the angleKey property. */
    readonly angleValue?: any;
    /** angleName as specified on series options. */
    readonly angleName?: string;

    /** radiusKey as specified on series options. */
    readonly radiusKey?: string;
    /** radiusValue as read from series data via the radiusKey property. */
    readonly radiusValue?: any;
    /** radiusName as specified on series options. */
    readonly radiusName?: string;
}
