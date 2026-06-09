import { BubbleSeries } from './bubbleSeries';
import { type BubbleScatterSeriesProperties, ScatterSeriesProperties } from './bubbleSeriesProperties';

export class ScatterSeries extends BubbleSeries {
    static override readonly className = 'ScatterSeries';
    static override readonly type = 'scatter';

    override properties: BubbleScatterSeriesProperties = new ScatterSeriesProperties();
}
