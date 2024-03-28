import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { SunburstSeriesProperties } from './sunburstSeriesProperties';
export declare class SunburstSeries extends _ModuleSupport.HierarchySeries<_Scene.Group, SunburstSeriesProperties, _ModuleSupport.SeriesNodeDatum> {
    static readonly className = "SunburstSeries";
    static readonly type: "sunburst";
    properties: SunburstSeriesProperties;
    groupSelection: _Scene.Selection<_Scene.Group, any>;
    private highlightSelection;
    private angleData;
    private labelData?;
    processData(): Promise<void>;
    updateSelections(): Promise<void>;
    updateNodes(): Promise<void>;
    private getSectorFormat;
    getTooltipHtml(node: _ModuleSupport.HierarchyNode): string;
    createNodeData(): Promise<never[]>;
    protected animateEmptyUpdateReady({ datumSelections, }: _ModuleSupport.HierarchyAnimationData<_Scene.Group, _ModuleSupport.SeriesNodeDatum>): void;
}
