import { type AgNightingaleSeriesOptions, type AgRadialSeriesStyle, _ModuleSupport, _Scene } from 'ag-charts-community';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBaseProperties } from '../radial-column/radialColumnSeriesBaseProperties';
export declare class NightingaleSeries extends RadialColumnSeriesBase<_Scene.Sector> {
    static readonly className = "NightingaleSeries";
    static readonly type: "nightingale";
    properties: RadialColumnSeriesBaseProperties<AgNightingaleSeriesOptions<any>>;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected getStackId(): string;
    protected nodeFactory(): _Scene.Sector;
    protected updateItemPath(node: _Scene.Sector, datum: RadialColumnNodeDatum, highlight: boolean, _format: AgRadialSeriesStyle | undefined): void;
    protected getColumnTransitionFunctions(): {
        toFn: (_sect: _Scene.Sector, datum: RadialColumnNodeDatum, status: _ModuleSupport.NodeUpdateState) => {
            innerRadius: number;
            outerRadius: number;
            startAngle: number;
            endAngle: number;
            clipSector: _Scene.SectorBox;
        };
        fromFn: (sect: _Scene.Sector, datum: RadialColumnNodeDatum, status: _ModuleSupport.NodeUpdateState) => {
            innerRadius: number;
            outerRadius: number;
            startAngle: number;
            endAngle: number;
            clipSector: _Scene.SectorBox;
            phase: "end" | "initial" | "update" | "none" | "trailing" | "remove" | "add";
        };
    };
}
