import type { ModuleContext } from '../../../module/moduleContext';
import { ColorScale } from '../../../scale/colorScale';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs } from '../series';
import type { CartesianAnimationData } from './cartesianSeries';
import { CartesianSeries } from './cartesianSeries';
import { type ScatterNodeDatum, ScatterSeriesProperties } from './scatterSeriesProperties';
type ScatterAnimationData = CartesianAnimationData<Group, ScatterNodeDatum>;
export declare class ScatterSeries extends CartesianSeries<Group, ScatterSeriesProperties, ScatterNodeDatum> {
    static readonly className = "ScatterSeries";
    static readonly type: "scatter";
    properties: ScatterSeriesProperties;
    readonly colorScale: ColorScale;
    constructor(moduleCtx: ModuleContext);
    processData(dataController: DataController): Promise<void>;
    getSeriesDomain(direction: ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: ScatterNodeDatum[];
        labelData: ScatterNodeDatum[];
        scales: {
            x?: import("./scaling").Scaling | undefined;
            y?: import("./scaling").Scaling | undefined;
        };
        visible: boolean;
    } | undefined>;
    protected isPathOrSelectionDirty(): boolean;
    getLabelData(): PointLabelDatum[];
    protected markerFactory(): Marker;
    protected updateMarkerSelection(opts: {
        nodeData: ScatterNodeDatum[];
        markerSelection: Selection<Marker, ScatterNodeDatum>;
    }): Promise<Selection<Marker, ScatterNodeDatum>>;
    protected updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, ScatterNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: ScatterNodeDatum[];
        labelSelection: Selection<Text, ScatterNodeDatum>;
    }): Promise<Selection<Text, ScatterNodeDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: Selection<Text, ScatterNodeDatum>;
    }): Promise<void>;
    getTooltipHtml(nodeDatum: ScatterNodeDatum): TooltipContent;
    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[];
    animateEmptyUpdateReady(data: ScatterAnimationData): void;
    protected isLabelEnabled(): boolean;
    protected nodeFactory(): Group;
    getFormattedMarkerStyle(datum: ScatterNodeDatum): import("ag-charts-types").AgSeriesMarkerStyle & {
        size: number;
    };
    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined;
}
export {};