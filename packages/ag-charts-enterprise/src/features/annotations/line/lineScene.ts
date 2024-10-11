import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { ArrowCapScene, type CapScene } from '../scenes/capScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import type { CollidableText } from '../scenes/collidableTextScene';
import { DivariantHandle } from '../scenes/handle';
import { LineWithTextScene } from '../scenes/lineWithTextScene';
import { StartEndScene } from '../scenes/startEndScene';
import { convertLine } from '../utils/values';
import type { LineTypeProperties } from './lineProperties';

const { Vec2, Vec4 } = _ModuleSupport;

export class LineScene extends StartEndScene<LineTypeProperties> {
    static override is(value: unknown): value is LineScene {
        return AnnotationScene.isCheck(value, 'line');
    }

    type = 'line';

    private readonly line = new CollidableLine();
    public text?: CollidableText;
    private startCap?: CapScene;
    private endCap?: CapScene;

    constructor() {
        super();
        this.append([this.line, this.start, this.end]);
    }

    public override update(datum: LineTypeProperties, context: AnnotationContext) {
        const coords = convertLine(datum, context);

        if (coords == null) {
            this.visible = false;
            return;
        }

        this.visible = datum.visible ?? true;
        if (!this.visible) return;

        this.updateLine(datum, coords, context);
        this.updateHandles(datum, coords);
        this.updateText(datum, coords);
        this.updateCaps(datum, coords);
        this.updateAnchor(datum, coords, context);
    }

    private updateLine(datum: LineTypeProperties, coords: _ModuleSupport.Vec4, context: AnnotationContext) {
        const { line } = this;
        const { lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        const linePoints = this.extendLine(coords, datum, context);

        line.setProperties({
            ...linePoints,
            lineCap: datum.getLineCap(),
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        });
    }

    private updateText(datum: LineTypeProperties, coords: _ModuleSupport.Vec4) {
        LineWithTextScene.updateLineText.call(this, this.line, datum, coords);
    }

    private updateCaps(datum: LineTypeProperties, coords: _ModuleSupport.Vec4) {
        if (!datum.startCap && this.startCap) {
            this.removeChild(this.startCap);
            this.startCap = undefined;
        }

        if (!datum.endCap && this.endCap) {
            this.removeChild(this.endCap);
            this.endCap = undefined;
        }

        if (!datum.startCap && !datum.endCap) return;

        const { stroke, strokeWidth, strokeOpacity } = datum;
        const [start, end] = Vec2.from(coords);
        const angle = Vec2.angle(Vec2.sub(end, start));

        if (datum.startCap) {
            if (this.startCap && this.startCap.type !== datum.startCap) {
                this.removeChild(this.startCap);
                this.startCap = undefined;
            }

            if (this.startCap == null) {
                this.startCap = new ArrowCapScene();
                this.append([this.startCap]);
            }

            this.startCap.update({
                x: start.x,
                y: start.y,
                angle: angle - Math.PI,
                stroke,
                strokeWidth,
                strokeOpacity,
            });
        }

        if (datum.endCap) {
            if (this.endCap && this.endCap.type !== datum.endCap) {
                this.removeChild(this.endCap);
                this.endCap = undefined;
            }

            if (this.endCap == null) {
                this.endCap = new ArrowCapScene();
                this.append([this.endCap]);
            }

            this.endCap.update({
                x: end.x,
                y: end.y,
                angle,
                stroke,
                strokeWidth,
                strokeOpacity,
            });
        }
    }

    override updateAnchor(
        _datum: LineTypeProperties,
        coords: _ModuleSupport.Vec4,
        _context: AnnotationContext,
        _bbox?: _Scene.BBox
    ) {
        const point = Vec4.topCenter(coords);
        Vec2.apply(this.anchor, _Scene.Transformable.toCanvasPoint(this.line, point.x, point.y));
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
        _datum: LineTypeProperties,
        coords: _ModuleSupport.Vec4,
        handle: 'start' | 'end',
        _bbox?: _Scene.BBox | undefined
    ): _ModuleSupport.Vec2 {
        const { startCap, endCap } = this;

        let [startPoint, endPoint] = Vec2.from(coords);

        // Offset the handles so they do not cover the caps
        const angle = Vec2.angle(Vec2.sub(endPoint, startPoint));
        if (startCap) {
            startPoint = Vec2.rotate(Vec2.from(0, -DivariantHandle.HANDLE_SIZE / 2), angle, startPoint);
        }
        if (endCap) {
            endPoint = Vec2.rotate(Vec2.from(0, DivariantHandle.HANDLE_SIZE / 2), angle, endPoint);
        }

        return handle === 'start' ? startPoint : endPoint;
    }

    protected override getHandleStyles(datum: LineTypeProperties) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? datum.strokeWidth,
        };
    }
}
