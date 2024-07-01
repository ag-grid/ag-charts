import { RadarSeries } from '../radar/radarSeries';
export declare class RadarLineSeries extends RadarSeries {
    static readonly className = "RadarLineSeries";
    static readonly type: "radar-line";
    protected updatePathSelections(): void;
}
