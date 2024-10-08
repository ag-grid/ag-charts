import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { ArrowCapScene } from '../scenes/capScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import type { CollidableText } from '../scenes/collidableTextScene';
import { LineWithTextScene } from '../scenes/lineWithTextScene';
import { StartEndScene } from '../scenes/startEndScene';
import { WithBackgroundScene } from '../scenes/withBackgroundScene';
import { convertLine } from '../utils/values';
import { DateRangeProperties, type MeasurerTypeProperties, PriceRangeProperties } from './measurerProperties';
import { MeasurerStatisticsScene, type Statistics } from './measurerStatisticsScene';

const { Vec2 } = _ModuleSupport;

export class MeasurerScene extends StartEndScene<MeasurerTypeProperties> {
    static override is(value: unknown): value is MeasurerScene {
        return AnnotationScene.isCheck(value, 'measurer');
    }

    type = 'measurer';

    private readonly horizontalLine = new CollidableLine();
    private readonly verticalLine = new CollidableLine();
    public text?: CollidableText;

    // These four bounding lines are named after the way they are drawn, e.g. the horizontalStartLine is a horizontal
    // line that is only shown when the measurer has the 'vertical' direction.
    private readonly horizontalStartLine = new CollidableLine();
    private readonly horizontalEndLine = new CollidableLine();
    private readonly verticalStartLine = new CollidableLine();
    private readonly verticalEndLine = new CollidableLine();

    private readonly horizontalEndCap = new ArrowCapScene();
    private readonly verticalEndCap = new ArrowCapScene();

    public readonly background = new _Scene.Path({ zIndex: -1 });
    private readonly statistics = new MeasurerStatisticsScene();

    constructor() {
        super();
        this.append([
            this.background,
            this.verticalStartLine,
            this.verticalEndLine,
            this.horizontalStartLine,
            this.horizontalEndLine,
            this.horizontalLine,
            this.verticalLine,
            this.horizontalEndCap,
            this.verticalEndCap,
            this.statistics,
            this.start,
            this.end,
        ]);
    }

    public override update(datum: MeasurerTypeProperties, context: AnnotationContext) {
        const coords = convertLine(datum, context);

        if (coords == null) {
            this.visible = false;
            return;
        }

        this.visible = datum.visible ?? true;
        if (!this.visible) return;

        const extended = this.extendPerpendicular(coords, datum, context);
        const verticalStart = { ...extended, y2: extended.y1 };
        const verticalEnd = { ...extended, y1: extended.y2 };

        this.updateVisibilities(datum);
        this.updateLines(datum, coords);
        this.updateHandles(datum, coords);
        this.updateText(datum, coords);
        this.updateCaps(datum, coords);
        this.updateBoundingLines(datum, extended);
        this.updateBackground(datum, verticalStart, verticalEnd, context);
        this.updateStatistics(datum, coords, context);
        this.updateAnchor(datum, coords, context);
    }

    private extendPerpendicular(
        coords: _ModuleSupport.Vec4,
        datum: MeasurerTypeProperties,
        context: AnnotationContext
    ) {
        const extended = {
            x1: Math.min(coords.x1, coords.x2),
            x2: Math.max(coords.x1, coords.x2),
            y1: Math.min(coords.y1, coords.y2),
            y2: Math.max(coords.y1, coords.y2),
        };

        const [start, end] = Vec2.from(context.yAxis.bounds);

        if (DateRangeProperties.is(datum)) {
            if (datum.extendAbove) extended.y1 = start.y;
            if (datum.extendBelow) extended.y2 = end.y;
        } else if (PriceRangeProperties.is(datum)) {
            if (datum.extendLeft) extended.x1 = start.x;
            if (datum.extendRight) extended.x2 = end.x;
        }

        return extended;
    }

    private updateVisibilities(datum: MeasurerTypeProperties) {
        const {
            horizontalStartLine,
            horizontalEndLine,
            horizontalEndCap,
            verticalStartLine,
            verticalEndLine,
            verticalEndCap,
        } = this;
        const { direction } = datum;

        verticalStartLine.visible = direction !== 'vertical';
        verticalEndLine.visible = direction !== 'vertical';
        horizontalEndCap.visible = direction !== 'vertical';

        horizontalStartLine.visible = direction !== 'horizontal';
        horizontalEndLine.visible = direction !== 'horizontal';
        verticalEndCap.visible = direction !== 'horizontal';
    }

    private updateLines(datum: MeasurerTypeProperties, coords: _ModuleSupport.Vec4) {
        const { horizontalLine, verticalLine } = this;
        const { direction, lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        const { x1, y1, x2, y2 } = coords;

        const xMiddle = x1 + (x2 - x1) / 2;
        const yMiddle = y1 + (y2 - y1) / 2;

        const lineStyles = {
            lineCap: datum.getLineCap(),
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        };

        if (direction !== 'vertical') {
            horizontalLine.setProperties({
                ...lineStyles,
                x1,
                x2,
                y1: yMiddle,
                y2: yMiddle,
            });
        }

        if (direction !== 'horizontal') {
            verticalLine.setProperties({
                ...lineStyles,
                x1: xMiddle,
                x2: xMiddle,
                y1,
                y2,
            });
        }
    }

    private updateText(datum: MeasurerTypeProperties, coords: _ModuleSupport.Vec4) {
        const { direction } = datum;
        const { x1, y1, x2, y2 } = coords;

        let line;
        const textCoords = { ...coords };

        if (direction === 'vertical') {
            line = this.verticalLine;
            textCoords.x1 = x1 + (x2 - x1) / 2;
            textCoords.x2 = textCoords.x1;
        } else {
            line = this.horizontalLine;
            textCoords.y1 = y1 + (y2 - y1) / 2;
            textCoords.y2 = textCoords.y1;
        }

        LineWithTextScene.updateLineText.call(this, line, datum, textCoords);
    }

    private updateCaps(datum: MeasurerTypeProperties, coords: _ModuleSupport.Vec4) {
        const { horizontalEndCap, verticalEndCap } = this;
        const { direction, stroke, strokeWidth, strokeOpacity } = datum;
        const { x1, y1, x2, y2 } = coords;

        const xMiddle = x1 + (x2 - x1) / 2;
        const yMiddle = y1 + (y2 - y1) / 2;

        const capStyles = { stroke, strokeWidth, strokeOpacity };

        if (direction !== 'vertical') {
            const angle = x1 <= x2 ? 0 : Math.PI;
            horizontalEndCap.update({ ...capStyles, x: x2, y: yMiddle, angle });
        }

        if (direction !== 'horizontal') {
            const angle = y1 <= y2 ? Math.PI / 2 : Math.PI / -2;
            verticalEndCap.update({ ...capStyles, x: xMiddle, y: y2, angle });
        }
    }

    private updateBoundingLines(datum: MeasurerTypeProperties, extendedCoords: _ModuleSupport.Vec4) {
        const { verticalStartLine, verticalEndLine, horizontalStartLine, horizontalEndLine } = this;
        const { direction, lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        const { x1, y1, x2, y2 } = extendedCoords;

        const lineStyles = {
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        };

        if (direction === 'horizontal') {
            verticalStartLine.setProperties({ ...lineStyles, x1, y1, x2: x1, y2 });
            verticalEndLine.setProperties({ ...lineStyles, x1: x2, y1, x2, y2 });
        }

        if (direction === 'vertical') {
            horizontalStartLine.setProperties({ ...lineStyles, x1, y1, x2, y2: y1 });
            horizontalEndLine.setProperties({ ...lineStyles, x1, y1: y2, x2, y2 });
        }
    }

    private readonly updateBackground = WithBackgroundScene.updateBackground.bind(this);

    private updateStatistics(datum: MeasurerTypeProperties, coords: _ModuleSupport.Vec4, context: AnnotationContext) {
        const point = Vec2.from(coords.x1 + (coords.x2 - coords.x1) / 2, Math.max(coords.y1, coords.y2) + 10);

        const statistics: Statistics = { volume: this.getVolume() };

        if (datum.hasPriceRange) {
            statistics.priceRange = {
                percentage: this.getPriceRangePercentage(datum),
                value: this.getPriceRangeValue(datum),
            };
        }

        if (datum.hasDateRange) {
            statistics.dateRange = {
                bars: this.getDateRangeBars(coords, context),
                value: this.getDateRangeValue(datum),
            };
        }

        this.statistics.update(datum, statistics, point, datum.localeManager);
    }

    override updateAnchor(
        _datum: MeasurerTypeProperties,
        coords: _ModuleSupport.Vec4,
        _context: AnnotationContext,
        _bbox?: _Scene.BBox
    ) {
        const { x, y } = _Scene.Transformable.toCanvasPoint(
            this.horizontalLine,
            (coords.x1 + coords.x2) / 2,
            Math.min(coords.y1, coords.y2)
        );

        this.anchor.x = x;
        this.anchor.y = y;
    }

    public getBackgroundPoints(
        _datum: MeasurerTypeProperties,
        verticalStart: _ModuleSupport.Vec4,
        verticalEnd: _ModuleSupport.Vec4,
        _bounds: _ModuleSupport.Vec4
    ) {
        const [startStart, startEnd] = Vec2.from(verticalStart);
        const [endStart, endEnd] = Vec2.from(verticalEnd);

        return [startStart, startEnd, endEnd, endStart];
    }

    override getHandleStyles(datum: MeasurerTypeProperties) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? datum.strokeWidth,
        };
    }

    override containsPoint(x: number, y: number) {
        const {
            horizontalLine,
            text,
            verticalLine,
            horizontalStartLine,
            horizontalEndLine,
            verticalStartLine,
            verticalEndLine,
        } = this;

        return (
            super.containsPoint(x, y) ||
            horizontalLine.isPointInPath(x, y) ||
            verticalLine.isPointInPath(x, y) ||
            (horizontalStartLine.visible && horizontalStartLine.isPointInPath(x, y)) ||
            (horizontalEndLine.visible && horizontalEndLine.isPointInPath(x, y)) ||
            (verticalStartLine.visible && verticalStartLine.isPointInPath(x, y)) ||
            (verticalEndLine.visible && verticalEndLine.isPointInPath(x, y)) ||
            Boolean(text?.containsPoint(x, y))
        );
    }

    private getDateRangeBars(coords: _ModuleSupport.Vec4, context: AnnotationContext) {
        return Math.round(Math.abs((coords.x2 - coords.x1) / context.xAxis.scaleStep()));
    }

    private getDateRangeValue(datum: MeasurerTypeProperties) {
        if (
            datum.start.x == null ||
            datum.end.x == null ||
            !(datum.start.x instanceof Date) ||
            !(datum.end.x instanceof Date)
        ) {
            throw new Error('Can not create a date range measurement of non-date x-axis.');
        }

        return Math.abs(datum.end.x.getTime() - datum.start.x.getTime());
    }

    private getPriceRangePercentage(datum: MeasurerTypeProperties) {
        if (datum.start.y == null || datum.end.y == null) {
            throw new Error('Can not create a price range measurement of a non-numeric y-axis');
        }

        return (datum.end.y - datum.start.y) / datum.start.y;
    }

    private getPriceRangeValue(datum: MeasurerTypeProperties) {
        if (datum.start.y == null || datum.end.y == null) {
            throw new Error('Can not create a price range measurement of a non-numeric y-axis');
        }

        return datum.end.y - datum.start.y;
    }

    private getVolume() {
        return 0;
    }
}
