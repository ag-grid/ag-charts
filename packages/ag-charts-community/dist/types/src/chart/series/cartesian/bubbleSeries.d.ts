import type { ModuleContext } from '../../../module/moduleContext';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { CategoryLegendDatum } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { TooltipContent } from '../../tooltip/tooltip';
import type { PickFocusInputs, SeriesNodeEventTypes } from '../series';
import { BubbleNodeDatum, BubbleSeriesProperties } from './bubbleSeriesProperties';
import type { CartesianAnimationData } from './cartesianSeries';
import { CartesianSeries, CartesianSeriesNodeEvent } from './cartesianSeries';
type BubbleAnimationData = CartesianAnimationData<Group, BubbleNodeDatum>;
declare class BubbleSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends CartesianSeriesNodeEvent<TEvent> {
    readonly sizeKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: BubbleNodeDatum, series: BubbleSeries);
}
export declare class BubbleSeries extends CartesianSeries<Group, BubbleSeriesProperties, BubbleNodeDatum> {
    static readonly className = "BubbleSeries";
    static readonly type: "bubble";
    protected readonly NodeEvent: typeof BubbleSeriesNodeEvent;
    properties: BubbleSeriesProperties;
    private readonly sizeScale;
    private readonly colorScale;
    constructor(moduleCtx: ModuleContext);
    processData(dataController: DataController): Promise<void>;
    getSeriesDomain(direction: ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: BubbleNodeDatum[];
        labelData: BubbleNodeDatum[];
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
        nodeData: BubbleNodeDatum[];
        markerSelection: Selection<Marker, BubbleNodeDatum>;
    }): Promise<Selection<Marker, BubbleNodeDatum>>;
    protected updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, BubbleNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: BubbleNodeDatum[];
        labelSelection: Selection<Text, BubbleNodeDatum>;
    }): Promise<Selection<Text, BubbleNodeDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: Selection<Text, BubbleNodeDatum>;
    }): Promise<void>;
    getTooltipHtml(nodeDatum: BubbleNodeDatum): TooltipContent;
    getLegendData(): CategoryLegendDatum[];
    animateEmptyUpdateReady({ markerSelection, labelSelection }: BubbleAnimationData): void;
    protected isLabelEnabled(): boolean;
    protected nodeFactory(): Group;
    getFormattedMarkerStyle(datum: BubbleNodeDatum): import("../../../main").AgSeriesMarkerStyle & {
        size: number;
    };
    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined;
}
export {};
