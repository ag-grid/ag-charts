import { _ModuleSupport } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import type { FibonacciProperties } from '../properties/fibonacciProperties';
import { FibonacciNodeTag, createFibonacciRangesData } from '../utils/fibonacci';
import type { FibonacciRangeDatum } from '../utils/fibonacci';
import { updateLineText } from '../utils/lineWithText';
import { convertLine } from '../utils/values';
import { AnnotationScene } from './annotationScene';
import { CollidableLine } from './collidableLineScene';
import { CollidableText } from './collidableTextScene';

const { Vec2, Vec4 } = _ModuleSupport;

export abstract class FibonacciScene<Datum extends FibonacciProperties> extends AnnotationScene {
    private readonly trendLine = new CollidableLine();
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

        this.updateTrendLine(datum, coords);
        this.updateHandles(datum, coords);
        this.updateAnchor(datum, coords, context);

        const { reverse } = datum;

        const extendedCoords = this.extendLine(coords, datum, context);
        this.updateRanges(datum, extendedCoords, context);

        const y = reverse ? coords.y2 : coords.y1;
        const oneLinePoints = { ...extendedCoords, y1: y, y2: y };
        this.updateText(datum, oneLinePoints);
    }

    protected extendLine({ x1, y1, x2, y2 }: _ModuleSupport.Vec4, datum: Datum, context: AnnotationContext) {
        // Clone the points to prevent mutating the original
        const linePoints = { x1, y1, x2, y2 };

        if (!datum.extendStart && !datum.extendEnd) {
            return linePoints;
        }

        const { x, width } = context.xAxis.bounds;

        if (datum.extendEnd) {
            linePoints.x2 = x + width;
        }

        if (datum.extendStart) {
            linePoints.x1 = x;
        }

        return linePoints;
    }

    private updateTrendLine(datum: Datum, coords: _ModuleSupport.Vec4) {
        const { trendLine } = this;
        const { lineDashOffset, strokeWidth, strokeOpacity } = datum;

        trendLine.setProperties({
            ...coords,
            lineCap: datum.getLineCap(),
            lineDash: [3, 4],
            lineDashOffset,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
            stroke: '#2b5c95', // shouldn't change with the floating toolbar, not sure if any way to configure?
        });
    }

    private updateRangeStrokes(datum: Datum) {
        const { lineDashOffset, strokeWidth, strokeOpacity, strokes } = datum;

        const firstStroke = strokes[0];
        this.rangeStrokesGroupSelection.each((line, { x1, x2, y2, tag }, index) => {
            const y = y2;
            const color = strokes[index] ?? firstStroke;
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

    private updateRanges(datum: Datum, coords: _ModuleSupport.Vec4, context: AnnotationContext) {
        const data = createFibonacciRangesData(coords, context, datum.reverse);

        const getDatumId = (d: FibonacciRangeDatum) => d.id;
        this.rangeFillsGroupSelection.update(data, undefined, getDatumId);
        this.rangeStrokesGroupSelection.update(data, undefined, getDatumId);
        this.labelsGroupSelection.update(data, undefined, getDatumId);

        this.updateRangeFills(datum);
        this.updateRangeStrokes(datum);
        this.updateRangeLabels(datum, context);
    }

    private updateRangeFills(datum: Datum) {
        const { lineDashOffset, strokeWidth, strokeOpacity, strokes: colors } = datum;

        const firstColor = colors[0];
        this.rangeFillsGroupSelection.each((range, { x1, x2, y1, y2 }, index) => {
            const color = colors[index] ?? firstColor;
            range.setProperties({
                x1,
                x2,
                y1,
                y2,
                startLine: false,
                endLine: false,
                isRange: true,
                stroke: color,
                strokeOpacity,
                fill: color,
                fillOpacity: 0.15,
                strokeWidth,
                lineCap: datum.getLineCap(),
                lineDash: datum.getLineDash(),
                lineDashOffset,
            });
        });
    }

    private updateRangeLabels(trendLineProperties: Datum, { xAxis }: AnnotationContext) {
        const { rangeStrokesGroupSelection } = this;
        const { strokes: colors, strokeWidth } = trendLineProperties;

        const firstColor = colors[0];
        this.labelsGroupSelection.each((textNode, datum, index) => {
            const color = colors[index] ?? firstColor;

            const line = rangeStrokesGroupSelection.at(index);

            if (!line) {
                return;
            }

            const { text, ...coords } = datum.label;
            const labelProperties = trendLineProperties.label;

            updateLineText(textNode.id, line, labelProperties, coords, textNode);

            textNode.setProperties({
                text,
                x: coords.x1,
                y: coords.y1,
                textBaseline: 'middle',
                textAlign: 'end',
            });

            const { x } = textNode.getBBox();

            const xWithinBounds = x >= xAxis.bounds.x && x <= xAxis.bounds.x + xAxis.bounds.width;

            if (!xWithinBounds) updateLineText(textNode.id, line, labelProperties, coords, textNode, text, strokeWidth);

            textNode.setProperties({
                fill: color,
            });
        });
    }

    private updateText(datum: Datum, coords: _ModuleSupport.Vec4) {
        const oneLine = this.rangeStrokesGroupSelection.selectByTag<CollidableLine>(FibonacciNodeTag.OneLine)[0];
        const { text: textProperties, strokeWidth } = datum;
        this.text = this.updateNode(CollidableText, this.text, !!textProperties.label);

        updateLineText(oneLine.id, oneLine, textProperties, coords, this.text, textProperties.label, strokeWidth);
    }

    updateAnchor(_datum: Datum, coords: _ModuleSupport.Vec4, _context: AnnotationContext, _bbox?: _ModuleSupport.BBox) {
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

    public drag(datum: Datum, target: _ModuleSupport.Vec2, context: AnnotationContext, snapping: boolean) {
        if (datum.locked) return;

        if (this.activeHandle) {
            this.dragHandle(datum, target, context, snapping);
        } else {
            this.dragAll(datum, target, context);
        }
    }

    protected abstract dragHandle(
        datum: Datum,
        target: _ModuleSupport.Vec2,
        context: AnnotationContext,
        snapping: boolean
    ): void;

    protected abstract dragAll(datum: Datum, target: _ModuleSupport.Vec2, context: AnnotationContext): void;

    public abstract translatePoints({
        datum,
        start,
        end,
        translation,
        context,
    }: {
        datum: Datum;
        start: _ModuleSupport.Vec2;
        end: _ModuleSupport.Vec2;
        translation: _ModuleSupport.Vec2;
        context: AnnotationContext;
    }): void;

    public abstract translate(datum: Datum, translation: _ModuleSupport.Vec2, context: AnnotationContext): void;

    public abstract copy(datum: Datum, copiedDatum: Datum, context: AnnotationContext): void;

    public abstract snapToAngle(datum: Datum, coords: _ModuleSupport.Vec2, context: AnnotationContext): void;

    override getAnchor() {
        return this.anchor;
    }

    override getCursor() {
        return 'pointer';
    }

    protected abstract updateHandles(datum: Datum, coords: _ModuleSupport.Vec4, bbox?: _ModuleSupport.BBox): void;
}
