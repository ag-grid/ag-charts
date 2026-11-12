import { DonutSeries } from './donutSeries';

export class PieSeries extends DonutSeries {
    static override readonly className = 'PieSeries';
    static override readonly type = 'pie';

    // A pie has no inner circle, so its sectors are its only content and cast their highlight glows in their own group.
    protected override castsHighlightGlowInGroup() {
        return true;
    }
}
