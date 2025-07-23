import { RadarSeries } from '../radar/radarSeries';

export class RadarLineSeries extends RadarSeries {
    static override readonly className = 'RadarLineSeries';
    static readonly type = 'radar-line' as const;

    protected override hasItemStylers(): boolean {
        return this.properties.marker.itemStyler != null || this.properties.label.itemStyler != null;
    }

    protected override updatePathSelections() {
        this.lineSelection.update(this.visible ? [true] : []);
    }
}
