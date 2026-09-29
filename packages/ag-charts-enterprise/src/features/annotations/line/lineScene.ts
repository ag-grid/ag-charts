import type { Bounds4, BoxBounds, Point } from 'ag-charts-core';
import { Vec2, Vec4 } from 'ag-charts-core';

import type { AnnotationContext } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { ArrowCapScene, type CapScene } from '../scenes/capScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import { CollidableText } from '../scenes/collidableTextScene';
import { DivariantHandle } from '../scenes/handle';
import { StartEndScene } from '../scenes/startEndScene';
import { applySceneNodeTopCenterAnchor } from '../utils/coords';
import { getLineCap, getLineDash } from '../utils/line';
import { updateLineText } from '../utils/lineWithText';
import { convertLine } from '../utils/values';
import { type LineTypeDatum, arrowDatum } from './lineDatum';

export class LineScene extends StartEndScene<LineTypeDatum> {
    static override is(value: unknown): value is LineScene {
        return AnnotationScene.isCheck(value, 'line');
    }

    type = 'line';

    private readonly line = new CollidableLine();
    public text?: CollidableText<never>;
    private endCap?: CapScene;

    constructor() {
        super();
        this.append([this.line, this.start, this.end]);
    }

    public override update(datum: LineTypeDatum, context: AnnotationContext) {
        let coords = convertLine(datum, context);

        if (coords == null) {
            this.visible = false;
            return;
        }

        coords = Vec4.round(coords);

        this.visible = datum.visible ?? true;
        if (!this.visible) return;

        this.updateLine(datum, coords, context);
        this.updateHandles(datum, coords);
        this.updateText(datum, coords);
        this.updateCaps(datum, coords);
        this.updateAnchor(datum, coords, context);
    }

    private updateLine(datum: LineTypeDatum, coords: Bounds4, context: AnnotationContext) {
        const { line } = this;
        const { lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        const linePoints = this.extendLine(coords, datum, context);

        line.setProperties({
            ...linePoints,
            lineCap: getLineCap(datum),
            lineDash: getLineDash(datum),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        });
    }

    private updateText(datum: LineTypeDatum, coords: Bounds4) {
        this.text = this.updateNode(CollidableText<never>, this.text, datum.text.label !== '');
        updateLineText(this.line.id, this.line, coords, datum.text, this.text, datum.text.label, datum.strokeWidth);
    }

    private updateCaps(datum: LineTypeDatum, coords: Bounds4) {
        const hasEndCap = arrowDatum.is(datum);

        if (!hasEndCap) {
            this.endCap?.remove();
            this.endCap = undefined;
            return;
        }

        if (this.endCap == null) {
            this.endCap = new ArrowCapScene();
            this.append([this.endCap]);
        }

        const { stroke, strokeWidth, strokeOpacity } = datum;
        const [start, end] = Vec2.from(coords);
        const angle = Vec2.angle(Vec2.sub(end, start));

        this.endCap.update({
            x: end.x,
            y: end.y,
            angle,
            stroke,
            strokeWidth,
            strokeOpacity,
        });
    }

    override updateAnchor(_datum: LineTypeDatum, coords: Bounds4, _context: AnnotationContext, _bbox?: BoxBounds) {
        applySceneNodeTopCenterAnchor(this.line, this.anchor, coords);
    }

    override containsPoint(x: number, y: number) {
        const { line, text } = this;
        return super.containsPoint(x, y) || line.isPointInPath(x, y) || Boolean(text?.containsPoint(x, y));
    }

    public override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.text?.containsPoint(x, y)) return 'text';

        if (this.line.isPointInPath(x, y)) return 'line';

        return super.getNodeAtCoords(x, y);
    }

    protected override getHandleCoords(
        _datum: LineTypeDatum,
        coords: Bounds4,
        handle: 'start' | 'end',
        _bbox?: BoxBounds
    ): Point {
        const [startPoint, end] = Vec2.from(coords);
        let endPoint = end;

        // Offset the end handle so it does not cover the cap
        if (this.endCap) {
            const angle = Vec2.angle(Vec2.sub(endPoint, startPoint));
            endPoint = Vec2.rotate(Vec2.from(0, DivariantHandle.HANDLE_SIZE / 2), angle, endPoint);
        }

        return handle === 'start' ? startPoint : endPoint;
    }

    protected override getHandleStyles(datum: LineTypeDatum) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? datum.strokeWidth,
        };
    }
}
