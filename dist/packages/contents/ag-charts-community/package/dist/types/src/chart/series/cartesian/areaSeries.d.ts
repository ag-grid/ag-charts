import type { ModuleContext } from '../../../module/moduleContext';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { TooltipContent } from '../../tooltip/tooltip';
import { PickFocusInputs } from '../series';
import { AreaSeriesProperties } from './areaSeriesProperties';
import { type AreaSeriesNodeDataContext, type LabelSelectionDatum, type MarkerSelectionDatum } from './areaUtil';
import type { CartesianAnimationData } from './cartesianSeries';
import { CartesianSeries } from './cartesianSeries';
type AreaAnimationData = CartesianAnimationData<Group, MarkerSelectionDatum, LabelSelectionDatum, AreaSeriesNodeDataContext>;
export declare class AreaSeries extends CartesianSeries<Group, AreaSeriesProperties, MarkerSelectionDatum, LabelSelectionDatum, AreaSeriesNodeDataContext> {
    static readonly className = "AreaSeries";
    static readonly type: "area";
    properties: AreaSeriesProperties;
    constructor(moduleCtx: ModuleContext);
    processData(dataController: DataController): Promise<void>;
    getSeriesDomain(direction: ChartAxisDirection): any[];
    createNodeData(): Promise<AreaSeriesNodeDataContext | undefined>;
    protected isPathOrSelectionDirty(): boolean;
    protected markerFactory(): Marker;
    protected updatePathNodes(opts: {
        paths: Path[];
        opacity: number;
        visible: boolean;
        animationEnabled: boolean;
    }): Promise<void>;
    protected updatePaths(opts: {
        contextData: AreaSeriesNodeDataContext;
        paths: Path[];
    }): Promise<void>;
    private updateAreaPaths;
    private updateFillPath;
    private updateStrokePath;
    protected updateMarkerSelection(opts: {
        nodeData: MarkerSelectionDatum[];
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
    }): Promise<Selection<Marker, MarkerSelectionDatum>>;
    protected updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: LabelSelectionDatum[];
        labelSelection: Selection<Text, LabelSelectionDatum>;
    }): Promise<Selection<Text, LabelSelectionDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: Selection<Text, LabelSelectionDatum>;
    }): Promise<void>;
    getTooltipHtml(nodeDatum: MarkerSelectionDatum): TooltipContent;
    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[];
    animateEmptyUpdateReady(animationData: AreaAnimationData): void;
    protected animateReadyResize(animationData: AreaAnimationData): void;
    animateWaitingUpdateReady(animationData: AreaAnimationData): void;
    protected isLabelEnabled(): boolean;
    protected nodeFactory(): Group;
    getFormattedMarkerStyle(datum: MarkerSelectionDatum): import("../../../main").AgSeriesMarkerStyle & {
        size: number;
    };
    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined;
}
export {};
