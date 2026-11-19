import { DonutSeries } from './donutSeries';

export class PieSeries extends DonutSeries {
    static override readonly className = 'PieSeries';
    static override readonly type = 'pie';
}
