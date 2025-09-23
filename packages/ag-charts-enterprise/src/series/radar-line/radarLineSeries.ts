import type { AgBaseRadarSeriesOptions, AgRadarSeriesStyle } from 'ag-charts-community';

import { RadarSeries } from '../radar/radarSeries';
import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

type S = AgRadarSeriesStyle;
type O = AgBaseRadarSeriesOptions;
type P = RadarSeriesProperties<S, O>;
export class RadarLineSeries extends RadarSeries<S, O, P> {
    static override readonly className = 'RadarLineSeries';
    static readonly type = 'radar-line' as const;

    override properties = new RadarSeriesProperties();

    protected override hasItemStylers(): boolean {
        return this.properties.marker.itemStyler != null || this.properties.label.itemStyler != null;
    }

    protected override updatePathSelections() {
        this.lineSelection.update(this.visible ? [true] : []);
    }
}
