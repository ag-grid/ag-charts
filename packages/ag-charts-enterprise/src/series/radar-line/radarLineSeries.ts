import { RadarSeries } from '../radar/radarSeries';

export class RadarLineSeries extends RadarSeries {
    static override readonly className = 'RadarLineSeries';
    static readonly type = 'radar-line' as const;

    protected override updatePathSelections() {
        this.lineSelection.update(this.visible ? [true] : []);
    }
}
