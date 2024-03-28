import type { AgBaseCrossLineLabelOptions, FontStyle, FontWeight, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
export declare class PolarCrossLineLabel implements AgBaseCrossLineLabelOptions {
    enabled?: boolean;
    text?: string;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize: number;
    fontFamily: string;
    /**
     * The padding between the label and the line.
     */
    padding: number;
    /**
     * The color of the labels.
     */
    color?: string;
    parallel?: boolean;
}
export declare abstract class PolarCrossLine implements _ModuleSupport.CrossLine {
    protected static readonly LINE_LAYER_ZINDEX = _ModuleSupport.Layers.SERIES_CROSSLINE_LINE_ZINDEX;
    protected static readonly RANGE_LAYER_ZINDEX = _ModuleSupport.Layers.SERIES_CROSSLINE_RANGE_ZINDEX;
    protected static readonly LABEL_LAYER_ZINDEX = _ModuleSupport.Layers.SERIES_LABEL_ZINDEX;
    readonly id: string;
    enabled?: boolean;
    type?: _ModuleSupport.CrossLineType;
    range?: [any, any];
    value?: any;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: [];
    shape: 'polygon' | 'circle';
    label: PolarCrossLineLabel;
    scale?: _Scale.Scale<any, number>;
    clippedRange: [number, number];
    gridLength: number;
    sideFlag: 1 | -1;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    direction: _ModuleSupport.ChartAxisDirection;
    axisInnerRadius: number;
    axisOuterRadius: number;
    readonly group: _Scene.Group;
    readonly labelGroup: _Scene.Group;
    abstract update(visible: boolean): void;
    protected setSectorNodeProps(node: _Scene.Path | _Scene.Sector): void;
    protected setLabelNodeProps(node: _Scene.Text, x: number, y: number, baseline: CanvasTextBaseline, rotation: number): void;
    calculateLayout(_visible: boolean): _Scene.BBox | undefined;
}
