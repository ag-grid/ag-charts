import type {
    AgCartesianCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    FontStyle,
    FontWeight,
} from '../../options/agChartOptions';
import { BandScale } from '../../scale/bandScale';
import { ContinuousScale } from '../../scale/continuousScale';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import type { Point } from '../../scene/point';
import { Range } from '../../scene/shape/range';
import { Text } from '../../scene/shape/text';
import { createId } from '../../util/id';
import {
    NUMBER,
    OPTIONAL,
    OPT_ARRAY,
    OPT_BOOLEAN,
    OPT_COLOR_STRING,
    OPT_FONT_STYLE,
    OPT_FONT_WEIGHT,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_STRING,
    STRING,
    Validate,
    predicateWithMessage,
} from '../../util/validation';
import { checkDatum } from '../../util/value';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelRotation } from '../label';
import { Layers } from '../layers';
import type { CrossLine, CrossLineType } from './crossLine';
import type { CrossLineLabelPosition } from './crossLineLabelPosition';
import {
    POSITION_TOP_COORDINATES,
    calculateLabelChartPadding,
    calculateLabelTranslation,
    labelDirectionHandling,
} from './crossLineLabelPosition';

const CROSSLINE_LABEL_POSITIONS = [
    'top',
    'left',
    'right',
    'bottom',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
    'inside',
    'insideLeft',
    'insideRight',
    'insideTop',
    'insideBottom',
    'insideTopLeft',
    'insideBottomLeft',
    'insideTopRight',
    'insideBottomRight',
];

const OPT_CROSSLINE_LABEL_POSITION = predicateWithMessage(
    (v: any, ctx) => OPTIONAL(v, ctx, (v: any) => CROSSLINE_LABEL_POSITIONS.includes(v)),
    `expecting an optional crossLine label position keyword such as 'topLeft', 'topRight' or 'inside'`
);

const OPT_CROSSLINE_TYPE = predicateWithMessage(
    (v: any, ctx) => OPTIONAL(v, ctx, (v: any) => v === 'range' || v === 'line'),
    `expecting a crossLine type keyword such as 'range' or 'line'`
);

class CartesianCrossLineLabel implements AgCartesianCrossLineLabelOptions {
    @Validate(OPT_BOOLEAN)
    enabled?: boolean = undefined;

    @Validate(OPT_STRING)
    text?: string = undefined;

    @Validate(OPT_FONT_STYLE)
    fontStyle?: FontStyle = undefined;

    @Validate(OPT_FONT_WEIGHT)
    fontWeight?: FontWeight = undefined;

    @Validate(NUMBER(0))
    fontSize: number = 14;

    @Validate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    /**
     * The padding between the label and the line.
     */
    @Validate(NUMBER())
    padding: number = 5;

    /**
     * The color of the labels.
     */
    @Validate(OPT_COLOR_STRING)
    color?: string = 'rgba(87, 87, 87, 1)';

    @Validate(OPT_CROSSLINE_LABEL_POSITION)
    position?: CrossLineLabelPosition = undefined;

    @Validate(OPT_NUMBER(-360, 360))
    rotation?: number = undefined;

    @Validate(OPT_BOOLEAN)
    parallel?: boolean = undefined;
}

type NodeData = number[];

export class CartesianCrossLine implements CrossLine<CartesianCrossLineLabel> {
    protected static readonly LINE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_LINE_ZINDEX;
    protected static readonly RANGE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_RANGE_ZINDEX;

    static className = 'CrossLine';
    readonly id = createId(this);

    @Validate(OPT_BOOLEAN)
    enabled?: boolean = undefined;

    @Validate(OPT_CROSSLINE_TYPE)
    type?: CrossLineType = undefined;

    @Validate(OPT_ARRAY(2))
    range?: [any, any] = undefined;
    value?: any = undefined;

    @Validate(OPT_COLOR_STRING)
    fill?: string = undefined;

    @Validate(OPT_NUMBER(0, 1))
    fillOpacity?: number = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = undefined;

    @Validate(OPT_NUMBER())
    strokeWidth?: number = undefined;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity?: number = undefined;

    @Validate(OPT_LINE_DASH)
    lineDash?: [] = undefined;

    label: CartesianCrossLineLabel = new CartesianCrossLineLabel();

    scale?: Scale<any, number> = undefined;
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;
    parallelFlipRotation: number = 0;
    regularFlipRotation: number = 0;
    direction: ChartAxisDirection = ChartAxisDirection.X;

    readonly group = new Group({ name: `${this.id}`, layer: true, zIndex: CartesianCrossLine.LINE_LAYER_ZINDEX });
    private crossLineRange: Range = new Range();
    private crossLineLabel = new Text();
    private labelPoint?: Point = undefined;

    private data: NodeData = [];
    private startLine: boolean = false;
    private endLine: boolean = false;
    private isRange: boolean = false;

    constructor() {
        const { group, crossLineRange, crossLineLabel } = this;

        group.append([crossLineRange, crossLineLabel]);

        crossLineRange.pointerEvents = PointerEvents.None;
    }

    update(visible: boolean) {
        if (!this.enabled || !visible || this.data.length === 0) {
            this.group.visible = false;
            return;
        }

        this.group.visible = true;
        this.group.zIndex = this.getZIndex(this.isRange);
        this.updateNodes();
    }

    calculateLayout(visible: boolean): BBox | undefined {
        if (!visible) {
            return;
        }

        const dataCreated = this.createNodeData();
        if (!dataCreated) {
            return;
        }

        const { sideFlag, gridLength, data } = this;

        const boxes: BBox[] = [];

        const x1 = 0;
        const x2 = sideFlag * gridLength;
        const y1 = data[0];
        const y2 = data[1];
        const crossLineBox = new BBox(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x1 - x2), Math.abs(y1 - y2));
        boxes.push(crossLineBox);

        const labelBox = this.computeLabelBBox();
        if (labelBox) {
            boxes.push(labelBox);
        }

        return BBox.merge(boxes);
    }

    private updateNodes() {
        this.updateRangeNode();

        if (this.label.enabled) {
            this.updateLabel();
            this.positionLabel();
        }
    }

    private createNodeData(): boolean {
        const {
            scale,
            gridLength,
            sideFlag,
            direction,
            label: { position = 'top' },
            clippedRange,
            strokeWidth = 0,
        } = this;

        this.data = [];

        if (!scale) {
            return false;
        }

        const bandwidth = scale.bandwidth ?? 0;
        const padding = scale instanceof BandScale ? scale.padding * bandwidth : 0;
        const clippedRangeClamper = (x: number) =>
            Math.max(Math.min(...clippedRange), Math.min(Math.max(...clippedRange), x));

        const [xStart, xEnd] = [0, sideFlag * gridLength];
        let [yStart, yEnd] = this.getRange();

        let [clampedYStart, clampedYEnd] = [
            Number(scale.convert(yStart, { clampMode: 'clamped' })) - padding,
            scale.convert(yEnd, { clampMode: 'clamped' }) + bandwidth + padding,
        ];
        clampedYStart = clippedRangeClamper(clampedYStart);
        clampedYEnd = clippedRangeClamper(clampedYEnd);
        [yStart, yEnd] = [Number(scale.convert(yStart)) - padding, scale.convert(yEnd) + bandwidth + padding];

        const validRange =
            !isNaN(clampedYStart) &&
            !isNaN(clampedYEnd) &&
            (yStart === clampedYStart || yEnd === clampedYEnd || clampedYStart !== clampedYEnd) &&
            Math.abs(clampedYEnd - clampedYStart) > 0;

        if (validRange) {
            const reverse = clampedYStart !== Math.min(clampedYStart, clampedYEnd);

            if (reverse) {
                [clampedYStart, clampedYEnd] = [
                    Math.min(clampedYStart, clampedYEnd),
                    Math.max(clampedYStart, clampedYEnd),
                ];
                [yStart, yEnd] = [yEnd, yStart];
            }
        }

        this.isRange = validRange;
        this.startLine = !isNaN(yStart) && strokeWidth > 0 && yStart === clampedYStart;
        this.endLine = !isNaN(yEnd) && strokeWidth > 0 && yEnd === clampedYEnd;

        if (!validRange && !this.startLine && !this.endLine) {
            return false;
        }

        this.data = [clampedYStart, clampedYEnd];

        if (this.label.enabled) {
            const yDirection = direction === ChartAxisDirection.Y;

            const { c = POSITION_TOP_COORDINATES } = labelDirectionHandling[position] ?? {};
            const { x: labelX, y: labelY } = c({
                yDirection,
                xStart,
                xEnd,
                yStart: clampedYStart,
                yEnd: clampedYEnd,
            });

            this.labelPoint = {
                x: labelX,
                y: labelY,
            };
        }

        return true;
    }

    private updateRangeNode() {
        const {
            crossLineRange,
            sideFlag,
            gridLength,
            data,
            startLine,
            endLine,
            isRange,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            lineDash,
        } = this;

        crossLineRange.x1 = 0;
        crossLineRange.x2 = sideFlag * gridLength;
        crossLineRange.y1 = data[0];
        crossLineRange.y2 = data[1];
        crossLineRange.startLine = startLine;
        crossLineRange.endLine = endLine;
        crossLineRange.isRange = isRange;

        crossLineRange.fill = fill;
        crossLineRange.fillOpacity = fillOpacity ?? 1;

        crossLineRange.stroke = stroke;
        crossLineRange.strokeWidth = strokeWidth ?? 1;
        crossLineRange.strokeOpacity = this.strokeOpacity ?? 1;
        crossLineRange.lineDash = lineDash;
    }

    private updateLabel() {
        const { crossLineLabel, label } = this;

        if (!label.text) {
            return;
        }

        crossLineLabel.fontStyle = label.fontStyle;
        crossLineLabel.fontWeight = label.fontWeight;
        crossLineLabel.fontSize = label.fontSize;
        crossLineLabel.fontFamily = label.fontFamily;
        crossLineLabel.fill = label.color;
        crossLineLabel.text = label.text;
    }

    private positionLabel() {
        const {
            crossLineLabel,
            labelPoint: { x = undefined, y = undefined } = {},
            label: { parallel, rotation, position = 'top', padding = 0 },
            direction,
            parallelFlipRotation,
            regularFlipRotation,
        } = this;

        if (x === undefined || y === undefined) {
            return;
        }

        const { defaultRotation, configuredRotation } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        crossLineLabel.rotation = defaultRotation + configuredRotation;

        crossLineLabel.textBaseline = 'middle';
        crossLineLabel.textAlign = 'center';

        const bbox = crossLineLabel.computeTransformedBBox();

        if (!bbox) {
            return;
        }

        const yDirection = direction === ChartAxisDirection.Y;
        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection,
            padding,
            position,
            bbox,
        });

        crossLineLabel.translationX = x + xTranslation;
        crossLineLabel.translationY = y + yTranslation;
    }

    protected getZIndex(isRange: boolean = false): number {
        if (isRange) {
            return CartesianCrossLine.RANGE_LAYER_ZINDEX;
        }

        return CartesianCrossLine.LINE_LAYER_ZINDEX;
    }

    private getRange(): [any, any] {
        const { value, range, scale } = this;

        const isContinuous = ContinuousScale.is(scale);

        let [start, end] = range ?? [value, undefined];

        if (!isContinuous && end === undefined) {
            end = start;
        }

        start = checkDatum(start, isContinuous) != null ? start : undefined;
        end = checkDatum(end, isContinuous) != null ? end : undefined;

        if (isContinuous && start === end) {
            end = undefined;
        }

        if (start === undefined && end !== undefined) {
            start = end;
            end = undefined;
        }

        return [start, end];
    }

    private computeLabelBBox(): BBox | undefined {
        const { label } = this;
        if (!label.enabled) {
            return undefined;
        }
        const tempText = new Text();
        tempText.fontFamily = label.fontFamily;
        tempText.fontSize = label.fontSize;
        tempText.fontStyle = label.fontStyle;
        tempText.fontWeight = label.fontWeight;
        tempText.text = label.text;

        const {
            labelPoint: { x = undefined, y = undefined } = {},
            label: { parallel, rotation, position = 'top', padding = 0 },
            direction,
            parallelFlipRotation,
            regularFlipRotation,
        } = this;

        if (x === undefined || y === undefined) {
            return undefined;
        }

        const { configuredRotation } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        tempText.rotation = configuredRotation;

        tempText.textBaseline = 'middle';
        tempText.textAlign = 'center';

        const bbox = tempText.computeTransformedBBox();

        if (!bbox) {
            return undefined;
        }

        const yDirection = direction === ChartAxisDirection.Y;
        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection,
            padding,
            position,
            bbox,
        });

        tempText.translationX = x + xTranslation;
        tempText.translationY = y + yTranslation;

        return tempText.computeTransformedBBox();
    }

    calculatePadding(padding: Partial<Record<AgCrossLineLabelPosition, number>>) {
        const {
            isRange,
            startLine,
            endLine,
            direction,
            label: { padding: labelPadding = 0, position = 'top' },
        } = this;
        if (!isRange && !startLine && !endLine) {
            return;
        }

        const crossLineLabelBBox = this.computeLabelBBox();
        const labelX = crossLineLabelBBox?.x;
        const labelY = crossLineLabelBBox?.y;

        if (!crossLineLabelBBox || labelX == undefined || labelY == undefined) {
            return;
        }

        const chartPadding = calculateLabelChartPadding({
            yDirection: direction === ChartAxisDirection.Y,
            padding: labelPadding,
            position,
            bbox: crossLineLabelBBox,
        });

        padding.left = Math.max(padding.left ?? 0, chartPadding.left ?? 0);
        padding.right = Math.max(padding.right ?? 0, chartPadding.right ?? 0);
        padding.top = Math.max(padding.top ?? 0, chartPadding.top ?? 0);
        padding.bottom = Math.max(padding.bottom ?? 0, chartPadding.bottom ?? 0);
    }
}
