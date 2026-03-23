import { type TextOptions, _ModuleSupport } from 'ag-charts-community';
import { type Bounds4, type Point, Vec2, Vec4 } from 'ag-charts-core';

import type { AnnotationAxisContext, AnnotationContext, LineTextAlignment } from '../annotationTypes';
import type { FibonacciProperties } from '../properties/fibonacciProperties';
import type { FibonacciRangeDatum } from '../utils/fibonacci';
import { FibonacciNodeTag, createFibonacciRangesData } from '../utils/fibonacci';
import { updateLineText } from '../utils/lineWithText';
import { convertLine } from '../utils/values';
import { AnnotationScene } from './annotationScene';
import { CollidableLine } from './collidableLineScene';
import { CollidableText } from './collidableTextScene';

export abstract class FibonacciScene<Datum extends FibonacciProperties> extends AnnotationScene {
    protected readonly trendLine = new CollidableLine();
    public text?: CollidableText;

    private readonly rangeFillsGroup: _ModuleSupport.Group = new _ModuleSupport.Group({
        name: `${this.id}-range-fills`,
    });
    private readonly rangeFillsGroupSelection: _ModuleSupport.Selection<_ModuleSupport.Range, FibonacciRangeDatum> =
        _ModuleSupport.Selection.select(this.rangeFillsGroup, _ModuleSupport.Range);

    private readonly rangeStrokesGroup: _ModuleSupport.Group = new _ModuleSupport.Group({
        name: `${this.id}-range-strokes`,
    });
    private readonly rangeStrokesGroupSelection: _ModuleSupport.Selection<CollidableLine, FibonacciRangeDatum> =
        _ModuleSupport.Selection.select(this.rangeStrokesGroup, CollidableLine);

    private readonly labelsGroup: _ModuleSupport.Group = new _ModuleSupport.Group({
        name: `${this.id}-ranges-labels`,
    });
    private readonly labelsGroupSelection: _ModuleSupport.Selection<CollidableText, FibonacciRangeDatum> =
        _ModuleSupport.Selection.select(this.labelsGroup, CollidableText);

    protected anchor: _ModuleSupport.FloatingToolbarAnchor = {
        x: 0,
        y: 0,
        position: 'above',
    };

    constructor() {
        super();
        this.append([this.trendLine, this.rangeFillsGroup, this.rangeStrokesGroup, this.labelsGroup]);
    }

    public update(datum: Datum, context: AnnotationContext) {
        let coords = convertLine(datum, context);

        if (coords == null) {
            this.visible = false;
            return;
        }

        coords = Vec4.round(coords);

        this.visible = datum.visible ?? true;
        if (!this.visible) return;

        this.updateLine(datum, coords, this.trendLine);
        this.updateHandles(datum, coords);
        this.updateAnchor(datum, coords, context);

        const { reverse } = datum;

        const extendedCoords = this.extendLine(coords, datum, context);
        const yZero = reverse ? extendedCoords.y1 : extendedCoords.y2;
        const yOne = reverse ? extendedCoords.y2 : extendedCoords.y1;

        const data = createFibonacciRangesData(extendedCoords, context, datum.reverse, yZero, datum.bands);
        this.updateRanges(datum, data, context);

        const oneLinePoints = { ...extendedCoords, y1: yOne, y2: yOne };
        this.updateText(datum, oneLinePoints);
    }

    protected extendLine({ x1, y1, x2, y2 }: Bounds4, datum: Datum, context: AnnotationContext) {
        // Clone the points to prevent mutating the original
        const linePoints = { x1, y1, x2, y2 };

        if (!datum.extendStart && !datum.extendEnd) {
            return linePoints;
        }

        const { x, width } = context.xAxis.bounds;

        if (datum.extendEnd) {
            linePoints[x1 > x2 ? 'x1' : 'x2'] = x + width;
        }

        if (datum.extendStart) {
            linePoints[x1 > x2 ? 'x2' : 'x1'] = x;
        }

        return linePoints;
    }

    protected updateLine(datum: Datum, coords?: Bounds4, line?: CollidableLine) {
        if (!coords || !line) {
            return;
        }
        const { lineDashOffset, strokeWidth, strokeOpacity, stroke } = datum;

        line.setProperties({
            ...coords,
            lineCap: datum.getLineCap(),
            lineDash: [3, 4],
            lineDashOffset,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
            stroke,
        });
    }

    private updateRangeStrokes(datum: Datum) {
        const { lineDashOffset, strokeWidth, strokeOpacity, strokes, rangeStroke, isMultiColor } = datum;

        this.rangeStrokesGroupSelection.each((line, { x1, x2, y2, tag }, index) => {
            const y = y2;
            const color = isMultiColor ? strokes[index % strokes.length] : rangeStroke;
            line.setProperties({
                x1,
                x2,
                y1: y,
                y2: y,
                stroke: color,
                strokeOpacity,
                strokeWidth,
                lineCap: datum.getLineCap(),
                lineDash: datum.getLineDash(),
                lineDashOffset,
                tag,
            });
        });
    }

    protected updateRanges(datum: Datum, data: FibonacciRangeDatum[], context: AnnotationContext) {
        const getDatumId = (d: FibonacciRangeDatum) => d.id;
        this.rangeFillsGroupSelection.update(data, undefined, getDatumId);
        this.rangeStrokesGroupSelection.update(data, undefined, getDatumId);
        this.labelsGroupSelection.update(data, undefined, getDatumId);

        this.updateRangeFills(datum);
        this.updateRangeStrokes(datum);
        this.updateRangeLabels(datum, context);
    }

    private updateRangeFills(datum: Datum) {
        const {
            lineDashOffset,
            strokeWidth,
            strokeOpacity,
            strokes: colors,
            rangeStroke,
            showFill,
            isMultiColor,
        } = datum;

        this.rangeFillsGroupSelection.each((range, { x1, x2, y1, y2 }, index) => {
            const color = isMultiColor ? colors[index % colors.length] : rangeStroke;
            if (!showFill) {
                range.visible = false;
                return;
            }
            range.setProperties({
                x1,
                x2,
                y1,
                y2,
                startLine: false,
                endLine: false,
                stroke: color,
                strokeOpacity,
                fill: color,
                fillOpacity: (strokeOpacity ?? 1) * 0.15,
                strokeWidth,
                lineCap: datum.getLineCap(),
                lineDash: datum.getLineDash(),
                lineDashOffset,
                visible: true,
            });
        });
    }

    private updateRangeLabels(trendLineProperties: Datum, { xAxis, isRtl }: AnnotationContext) {
        const { rangeStrokesGroupSelection } = this;
        const {
            strokes: colors,
            strokeWidth,
            rangeStroke,
            isMultiColor,
            label: { fontFamily, fontSize, fontStyle, fontWeight, color },
        } = trendLineProperties;

        const labelProperties = {
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
        };

        const withinBounds = this.checkWithinBounds(xAxis, labelProperties, isRtl, this.labelsGroupSelection.at(0));

        this.labelsGroupSelection.each((textNode, datum, index) => {
            const textColor = color ?? (isMultiColor ? colors[index % colors.length] : rangeStroke);

            const line = rangeStrokesGroupSelection.at(index);

            if (!line) {
                return;
            }

            const { text, ...coords } = datum.label;

            if (withinBounds) {
                textNode.setProperties({
                    ...labelProperties,
                    text,
                    x: coords.x1,
                    y: coords.y1,
                    textBaseline: 'middle',
                    textAlign: isRtl ? 'left' : 'end',
                    fill: textColor,
                });
                updateLineText(textNode.id, line, coords);
            } else {
                const textProperties = {
                    ...labelProperties,
                    label: text,
                    position: 'center' as const,
                    alignment: (isRtl ? 'right' : 'left') as LineTextAlignment,
                    color: textColor,
                };
                updateLineText(textNode.id, line, coords, textProperties, textNode, text, strokeWidth);
            }
        });
    }

    private checkWithinBounds(
        xAxis: AnnotationAxisContext,
        fontOptions: TextOptions,
        isRtl: boolean,
        textNode?: CollidableText
    ) {
        if (!textNode) {
            return false;
        }
        const { text, ...coords } = textNode.datum.label;
        textNode.setProperties({
            ...fontOptions,
            text,
            x: coords.x1,
            y: coords.y1,
            textBaseline: 'middle',
            textAlign: isRtl ? 'left' : 'end',
        });

        const bbox = textNode.getBBox();
        const labelLeft = bbox.x;
        const labelRight = bbox.x + bbox.width;
        const boundsLeft = xAxis.bounds.x;
        const boundsRight = xAxis.bounds.x + xAxis.bounds.width;

        return labelLeft >= boundsLeft && labelRight <= boundsRight;
    }

    protected updateText(datum: Datum, coords: Bounds4) {
        const oneLine = this.rangeStrokesGroupSelection.selectByTag<CollidableLine>(FibonacciNodeTag.OneLine)[0];

        if (!oneLine) {
            return;
        }

        const { text: textProperties, strokeWidth } = datum;
        this.text = this.updateNode(CollidableText, this.text, !!textProperties.label);

        updateLineText(oneLine.id, oneLine, coords, textProperties, this.text, textProperties.label, strokeWidth);
    }

    updateAnchor(_datum: Datum, coords: Bounds4, _context: AnnotationContext, _bbox?: _ModuleSupport.BBox) {
        const point = Vec4.topCenter(coords);
        Vec2.apply(this.anchor, _ModuleSupport.Transformable.toCanvasPoint(this.trendLine, point.x, point.y));
    }

    containsPoint(x: number, y: number) {
        const { trendLine, rangeStrokesGroupSelection, text } = this;
        let isInStrokePath = false;
        rangeStrokesGroupSelection.each((line) => (isInStrokePath ||= line.isPointInPath(x, y)));
        return isInStrokePath || trendLine.isPointInPath(x, y) || Boolean(text?.containsPoint(x, y));
    }

    public override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.text?.containsPoint(x, y)) return 'text';

        if (this.trendLine.isPointInPath(x, y)) return 'line';
    }

    protected getHandleStyles(datum: Datum) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? datum.strokeWidth,
        };
    }

    public drag(datum: Datum, target: Point, context: AnnotationContext, snapping: boolean) {
        if (!datum.isWriteable()) return;

        if (this.activeHandle) {
            this.dragHandle(datum, target, context, snapping);
        } else {
            this.dragAll(datum, target, context);
        }
    }

    protected abstract dragHandle(datum: Datum, target: Point, context: AnnotationContext, snapping: boolean): void;

    protected abstract dragAll(datum: Datum, target: Point, context: AnnotationContext): void;

    public abstract translatePoints({
        datum,
        start,
        end,
        translation,
        context,
    }: {
        datum: Datum;
        start: Point;
        end: Point;
        translation: Point;
        context: AnnotationContext;
    }): void;

    public abstract translate(datum: Datum, translation: Point, context: AnnotationContext): void;

    public abstract copy(datum: Datum, copiedDatum: Datum, context: AnnotationContext): void;

    public abstract snapToAngle(datum: Datum, coords: Point, context: AnnotationContext): void;

    override getAnchor() {
        return this.anchor;
    }

    override getCursor() {
        return 'pointer';
    }

    protected abstract updateHandles(
        datum: Datum,
        coords1: Bounds4,
        coords2?: Bounds4,
        bbox?: _ModuleSupport.BBox
    ): void;
}
