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
import {
    DateRangeProperties,
    type MeasurerTypeProperties,
    PriceRangeProperties,
    QuickDatePriceRangeProperties,
} from './measurerProperties';
import { MeasurerStatisticsScene, type Statistics } from './measurerStatisticsScene';

const { Vec2, Vec4 } = _ModuleSupport;

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

    protected verticalDirection?: 'up' | 'down';

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

        this.verticalDirection = coords.y1 < coords.y2 ? 'down' : 'up';

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
        const { direction } = datum;
        const { x1, y1, x2, y2 } = coords;
        const center = Vec4.center(coords);

        const lineStyles = this.getLineStyles(datum);

        if (direction !== 'vertical') {
            horizontalLine.setProperties({
                ...lineStyles,
                x1,
                x2,
                y1: center.y,
                y2: center.y,
            });
        }

        if (direction !== 'horizontal') {
            verticalLine.setProperties({
                ...lineStyles,
                x1: center.x,
                x2: center.x,
                y1,
                y2,
            });
        }
    }

    private updateText(datum: MeasurerTypeProperties, coords: _ModuleSupport.Vec4) {
        const { direction } = datum;
        const center = Vec4.center(coords);

        let line;
        const textCoords = { ...coords };

        if (direction === 'vertical') {
            line = this.verticalLine;
            textCoords.x1 = center.x;
            textCoords.x2 = center.x;
        } else {
            line = this.horizontalLine;
            textCoords.y1 = center.y;
            textCoords.y2 = center.y;
        }

        const clip = LineWithTextScene.updateLineText.call(this, line, datum, textCoords);

        if (direction === 'both' && clip && this.text) {
            // Add a secondary clip mask to the vertical line that is pinned to the line's horizontal position and only
            // considers the height of the text, since we know the text must be axis-aligned.
            this.verticalLine.setClipMask({
                x: center.x,
                y: clip.clipMask.y,
                radius: this.text.getBBox().height / 2 + Vec2.length(clip.numbers.offset),
            });
        }
    }

    private updateCaps(datum: MeasurerTypeProperties, coords: _ModuleSupport.Vec4) {
        const { horizontalEndCap, verticalEndCap } = this;
        const { direction } = datum;
        const { x1, y1, x2, y2 } = coords;

        const center = Vec4.center(coords);

        const { stroke, strokeWidth, strokeOpacity } = this.getLineStyles(datum);
        const capStyles = { stroke, strokeWidth, strokeOpacity };

        if (direction !== 'vertical') {
            const angle = x1 <= x2 ? 0 : Math.PI;
            horizontalEndCap.update({ ...capStyles, x: x2, y: center.y, angle });
        }

        if (direction !== 'horizontal') {
            const angle = y1 <= y2 ? Math.PI / 2 : Math.PI / -2;
            verticalEndCap.update({ ...capStyles, x: center.x, y: y2, angle });
        }
    }

    private updateBoundingLines(datum: MeasurerTypeProperties, extendedCoords: _ModuleSupport.Vec4) {
        const { verticalStartLine, verticalEndLine, horizontalStartLine, horizontalEndLine } = this;
        const { direction } = datum;
        const { x1, y1, x2, y2 } = extendedCoords;

        const lineStyles = this.getLineStyles(datum);

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
        const point = Vec2.add(Vec4.bottomCenter(coords), Vec2.from(0, 10));
        const statistics: Statistics = { volume: this.getVolume(datum) };

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

        this.statistics.update(datum.statistics, statistics, point, context, datum.localeManager);
    }

    override updateAnchor(
        _datum: MeasurerTypeProperties,
        coords: _ModuleSupport.Vec4,
        _context: AnnotationContext,
        _bbox?: _Scene.BBox
    ) {
        const point = Vec4.topCenter(coords);
        Vec2.apply(this.anchor, _Scene.Transformable.toCanvasPoint(this.horizontalLine, point.x, point.y));
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

    protected getLineStyles(datum: MeasurerTypeProperties) {
        const { lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        return {
            lineCap: datum.getLineCap(),
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        };
    }

    public getBackgroundStyles(datum: MeasurerTypeProperties) {
        const { background } = datum;
        return {
            fill: background.fill,
            fillOpacity: background.fillOpacity,
        };
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

    override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.text?.containsPoint(x, y)) return 'text';
        if (this.start.containsPoint(x, y) || this.end.containsPoint(x, y)) return 'handle';

        return 'line';
    }

    private getDateRangeBars(coords: _ModuleSupport.Vec4, context: AnnotationContext) {
        const sign = coords.x1 <= coords.x2 ? 1 : -1;
        return Math.round(Vec4.width(coords) / context.xAxis.scaleStep()) * sign;
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

        return datum.end.x.getTime() - datum.start.x.getTime();
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

    private getVolume(datum: MeasurerTypeProperties) {
        return datum.getVolume?.(datum.start.x, datum.end.x);
    }
}

export class QuickMeasurerScene extends MeasurerScene {
    static override is(value: unknown): value is QuickMeasurerScene {
        return AnnotationScene.isCheck(value, 'quick-measurer');
    }

    override type = 'quick-measurer';

    private getDirectionStyles(datum: QuickDatePriceRangeProperties) {
        return this.verticalDirection === 'down' ? datum.down : datum.up;
    }

    override getLineStyles(datum: QuickDatePriceRangeProperties) {
        const styles = this.getDirectionStyles(datum);

        return {
            ...super.getLineStyles(datum),
            stroke: styles.stroke,
            strokeWidth: styles.strokeWidth,
            strokeOpacity: styles.strokeOpacity,
        };
    }

    override getBackgroundStyles(datum: QuickDatePriceRangeProperties) {
        const styles = this.getDirectionStyles(datum);

        return {
            fill: styles.fill,
            fillOpacity: styles.fillOpacity,
        };
    }

    override getHandleStyles(datum: QuickDatePriceRangeProperties) {
        const styles = this.getDirectionStyles(datum);

        return {
            fill: styles.handle.fill,
            stroke: styles.handle.stroke ?? styles.stroke,
            strokeOpacity: styles.handle.strokeOpacity ?? styles.strokeOpacity,
            strokeWidth: styles.handle.strokeWidth ?? styles.strokeWidth,
        };
    }
}
