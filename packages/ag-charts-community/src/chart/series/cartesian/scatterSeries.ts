import type { NormalisedScatterSeriesOwnOptions } from 'ag-charts-core';
import type { AgBubbleSeriesStylerResult, AgScatterSeriesStylerResult } from 'ag-charts-types';

import { BubbleScatterSeries } from './bubbleSeries';

export class ScatterSeries extends BubbleScatterSeries<NormalisedScatterSeriesOwnOptions> {
    static override readonly className = 'ScatterSeries';
    static readonly type = 'scatter';

    protected markerSizeRange() {
        const { size } = this.options;
        return { size, maxSize: size };
    }

    protected getSizeFloorOverride(
        stylerResult: AgBubbleSeriesStylerResult | AgScatterSeriesStylerResult
    ): number | undefined {
        return (stylerResult as AgScatterSeriesStylerResult).size;
    }
}
