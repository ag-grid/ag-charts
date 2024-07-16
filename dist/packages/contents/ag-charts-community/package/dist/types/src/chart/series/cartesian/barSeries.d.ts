import type { ModuleContext } from '../../../module/moduleContext';
import type { FontStyle, FontWeight } from '../../../options/agChartOptions';
import { BBox } from '../../../scene/bbox';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { TooltipContent } from '../../tooltip/tooltip';
import { PickFocusInputs } from '../series';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { AbstractBarSeries } from './abstractBarSeries';
import { BarSeriesProperties } from './barSeriesProperties';
import { type CartesianAnimationData, type CartesianSeriesNodeDatum } from './cartesianSeries';
interface BarNodeLabelDatum extends Readonly<Point> {
    readonly text: string;
    readonly fontStyle?: FontStyle;
    readonly fontWeight?: FontWeight;
    readonly fontSize: number;
    readonly fontFamily: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    readonly fill?: string;
}
interface BarNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum, Readonly<Point> {
    readonly xValue: string | number;
    readonly yValue: string | number;
    readonly valueIndex: number;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly fill: string | undefined;
    readonly stroke: string | undefined;
    readonly opacity: number | undefined;
    readonly strokeWidth: number;
    readonly cornerRadius: number;
    readonly topLeftCornerRadius: boolean;
    readonly topRightCornerRadius: boolean;
    readonly bottomRightCornerRadius: boolean;
    readonly bottomLeftCornerRadius: boolean;
    readonly clipBBox: BBox | undefined;
    readonly label?: BarNodeLabelDatum;
}
type BarAnimationData = CartesianAnimationData<Rect, BarNodeDatum>;
export declare class BarSeries extends AbstractBarSeries<Rect, BarSeriesProperties, BarNodeDatum> {
    static readonly className = "BarSeries";
    static readonly type: "bar";
    properties: BarSeriesProperties;
    constructor(moduleCtx: ModuleContext);
    processData(dataController: DataController): Promise<void>;
    getSeriesDomain(direction: ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: BarNodeDatum[];
        labelData: BarNodeDatum[];
        scales: {
            x?: import("./scaling").Scaling | undefined;
            y?: import("./scaling").Scaling | undefined;
        };
        visible: boolean;
    } | undefined>;
    protected nodeFactory(): Rect;
    protected updateDatumSelection(opts: {
        nodeData: BarNodeDatum[];
        datumSelection: Selection<Rect, BarNodeDatum>;
    }): Promise<Selection<Rect, BarNodeDatum>>;
    protected updateDatumNodes(opts: {
        datumSelection: Selection<Rect, BarNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: BarNodeDatum[];
        labelSelection: Selection<Text, BarNodeDatum>;
    }): Promise<Selection<Text, BarNodeDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: Selection<Text, BarNodeDatum>;
    }): Promise<void>;
    getTooltipHtml(nodeDatum: BarNodeDatum): TooltipContent;
    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[];
    animateEmptyUpdateReady({ datumSelection, labelSelection, annotationSelections }: BarAnimationData): void;
    animateWaitingUpdateReady(data: BarAnimationData): void;
    protected isLabelEnabled(): boolean;
    protected computeFocusBounds({ datumIndex, seriesRect }: PickFocusInputs): BBox | undefined;
}
export {};
