import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { RadarSeries } from '../radar/radarSeries';
import { RadarAreaSeriesProperties } from './radarAreaSeriesProperties';
export declare class RadarAreaSeries extends RadarSeries {
    static readonly className = "RadarAreaSeries";
    static readonly type: "radar-area";
    properties: RadarAreaSeriesProperties;
    protected areaSelection: _Scene.Selection<_Scene.Path, boolean>;
    resetInvalidToZero: boolean;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected updatePathSelections(): void;
    protected getAreaNode(): _Scene.Path;
    protected getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle): string;
    protected beforePathAnimation(): void;
    protected animatePaths(ratio: number): void;
    private getAreaPoints;
    protected resetPaths(): void;
}
