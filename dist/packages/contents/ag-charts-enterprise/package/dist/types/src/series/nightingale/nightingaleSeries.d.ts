import { type AgNightingaleSeriesOptions, type AgRadialSeriesFormat, _ModuleSupport, _Scene } from 'ag-charts-community';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBaseProperties } from '../radial-column/radialColumnSeriesBaseProperties';
export declare class NightingaleSeries extends RadialColumnSeriesBase<_Scene.Sector> {
    static className: string;
    static type: "nightingale";
    properties: RadialColumnSeriesBaseProperties<AgNightingaleSeriesOptions<any>>;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected getStackId(): string;
    protected nodeFactory(): _Scene.Sector;
    protected updateItemPath(node: _Scene.Sector, datum: RadialColumnNodeDatum, highlight: boolean, _format: AgRadialSeriesFormat | undefined): void;
    protected getColumnTransitionFunctions(): {
        toFn: (_sect: _Scene.Sector, datum: import("./nightingaleUtil").AnimatableNightingaleDatum, status: _ModuleSupport.NodeUpdateState) => {
            innerRadius: number;
            outerRadius: number;
            startAngle: number;
            endAngle: number;
        };
        fromFn: (sect: _Scene.Sector, datum: import("./nightingaleUtil").AnimatableNightingaleDatum, status: _ModuleSupport.NodeUpdateState) => {
            animationDuration: number;
            animationDelay: number;
            innerRadius: number;
            outerRadius: number;
            startAngle: number;
            endAngle: number;
        };
    };
}
