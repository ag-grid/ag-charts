import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { RadarSeries } from '../radar/radarSeries';
export declare class RadarAreaSeries extends RadarSeries {
    static className: string;
    static type: "radar-area";
    protected areaSelection: _Scene.Selection<_Scene.Path, boolean>;
    fill?: string;
    fillOpacity: number;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected updatePathSelections(): void;
    protected getAreaNode(): _Scene.Path;
    protected getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle): string | undefined;
    protected beforePathAnimation(): void;
    protected animatePaths(ratio: number): void;
    protected resetPaths(): void;
}
