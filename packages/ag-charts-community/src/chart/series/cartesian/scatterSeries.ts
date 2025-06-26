import { BubbleSeries } from './bubbleSeries';

export class ScatterSeries extends BubbleSeries {
    static override readonly className = 'ScatterSeries';
    static override readonly type = 'scatter';
}
