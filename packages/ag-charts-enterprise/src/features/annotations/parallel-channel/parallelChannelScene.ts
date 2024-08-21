import { _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { convertPoint, invertCoords, validateDatumPoint } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { ChannelScene } from '../scenes/channelScene';
import { DivariantHandle, UnivariantHandle } from '../scenes/handle';
import type { ParallelChannelProperties } from './parallelChannelProperties';

const { Vec2 } = _Util;

type ChannelHandle = keyof ParallelChannelScene['handles'];

export class ParallelChannelScene extends ChannelScene<ParallelChannelProperties> {
    static override is(value: unknown): value is ParallelChannelScene {
        return AnnotationScene.isCheck(value, 'parallel-channel');
    }

    type = 'parallel-channel';

    override activeHandle?: ChannelHandle;
    override handles = {
        topLeft: new DivariantHandle(),
        topMiddle: new UnivariantHandle(),
        topRight: new DivariantHandle(),
        bottomLeft: new DivariantHandle(),
        bottomMiddle: new UnivariantHandle(),
        bottomRight: new DivariantHandle(),
    };

    private readonly middleLine = new _Scene.Line();
    private text?: _Scene.TransformableText;

    constructor() {
        super();
        this.append([this.background, this.topLine, this.middleLine, this.bottomLine, ...Object.values(this.handles)]);
    }

    override toggleHandles(show: boolean | Partial<Record<ChannelHandle, boolean>>) {
        if (typeof show === 'boolean') {
            show = {
                topLeft: show,
                topMiddle: show,
                topRight: show,
                bottomLeft: show,
                bottomMiddle: show,
                bottomRight: show,
            };
        }

        for (const [handle, node] of Object.entries(this.handles)) {
            node.visible = show[handle as ChannelHandle] ?? true;
            node.toggleHovered(this.activeHandle === handle);
        }
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        for (const node of Object.values(this.handles)) {
            node.toggleActive(active);
        }
    }

    override dragHandle(datum: ParallelChannelProperties, target: Coords, context: AnnotationContext) {
        const { activeHandle, handles } = this;
        if (activeHandle == null) return;

        const { offset } = handles[activeHandle].drag(target);
        handles[activeHandle].toggleDragging(true);

        const prev = datum.toJson();
        let moves: Array<ChannelHandle> = [];

        switch (activeHandle) {
            case 'topLeft':
            case 'bottomLeft':
                moves = ['topLeft', 'bottomLeft'];
                break;
            case 'topMiddle':
                moves = ['topLeft', 'topRight'];
                offset.y -= UnivariantHandle.HANDLE_SIZE / 2;
                break;
            case 'topRight':
            case 'bottomRight':
                moves = ['topRight', 'bottomRight'];
                break;
            case 'bottomMiddle':
                moves = ['bottomLeft', 'bottomRight'];
                offset.y -= UnivariantHandle.HANDLE_SIZE / 2;
                break;
        }

        const invertedMoves = moves.map((move) => invertCoords(Vec2.add(handles[move].handle, offset), context));

        // Do not move any handles if some of them are trying to move to invalid points
        if (invertedMoves.some((invertedMove) => !validateDatumPoint(context, invertedMove))) {
            return;
        }

        // Adjust the height if dragging a middle handle
        if ((activeHandle === 'topMiddle' || activeHandle === 'bottomMiddle') && datum.start.y != null) {
            const topLeft = invertCoords(Vec2.add(handles.topLeft.handle, offset), context);

            if (validateDatumPoint(context, topLeft)) {
                if (activeHandle === 'topMiddle') {
                    datum.height += topLeft.y - datum.start.y;
                } else {
                    datum.height -= topLeft.y - datum.start.y;
                }
            }
        }

        // Move the start and end points if required
        for (const [index, invertedMove] of invertedMoves.entries()) {
            switch (moves[index]) {
                case 'topLeft':
                    datum.start.x = invertedMove.x;
                    datum.start.y = invertedMove.y;
                    break;

                case 'topRight':
                    datum.end.x = invertedMove.x;
                    datum.end.y = invertedMove.y;
                    break;
            }
        }

        if (!datum.isValidWithContext(context)) {
            datum.set(prev);
        }
    }

    protected override getOtherCoords(
        datum: ParallelChannelProperties,
        topLeft: Coords,
        topRight: Coords,
        context: AnnotationContext
    ): Coords[] {
        const { dragState } = this;

        if (!dragState) return [];

        const height = convertPoint(datum.bottom.start, context).y - convertPoint(datum.start, context).y;

        const bottomLeft = Vec2.add(topLeft, Vec2.from(0, height));
        const bottomRight = Vec2.add(topRight, Vec2.from(0, height));

        return [bottomLeft, bottomRight];
    }

    override updateLines(datum: ParallelChannelProperties, top: LineCoords, bottom: LineCoords) {
        const { topLine, middleLine, bottomLine } = this;
        const { lineDashOffset, stroke, strokeOpacity, strokeWidth, lineCap } = datum;

        const lineDash = datum.getLineDash();

        const lineStyles = {
            lineDash,
            lineDashOffset,
            stroke,
            strokeOpacity,
            strokeWidth,
            lineCap,
        };

        topLine.setProperties({
            x1: top.x1,
            y1: top.y1,
            x2: top.x2,
            y2: top.y2,
            ...lineStyles,
        });
        bottomLine.setProperties({
            x1: bottom.x1,
            y1: bottom.y1,
            x2: bottom.x2,
            y2: bottom.y2,
            ...lineStyles,
        });
        topLine.updateCollisionBBox();
        bottomLine.updateCollisionBBox();

        middleLine.setProperties({
            x1: top.x1,
            y1: bottom.y1 + (top.y1 - bottom.y1) / 2,
            x2: top.x2,
            y2: bottom.y2 + (top.y2 - bottom.y2) / 2,
            lineDash: datum.middle.lineDash ?? lineDash,
            lineDashOffset: datum.middle.lineDashOffset ?? lineDashOffset,
            stroke: datum.middle.stroke ?? stroke,
            strokeOpacity: datum.middle.strokeOpacity ?? strokeOpacity,
            strokeWidth: datum.middle.strokeWidth ?? strokeWidth,
            visible: datum.middle.visible ?? true,
        });
    }

    override updateHandles(datum: ParallelChannelProperties, top: LineCoords, bottom: LineCoords) {
        const {
            handles: { topLeft, topMiddle, topRight, bottomLeft, bottomMiddle, bottomRight },
        } = this;

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? datum.strokeWidth,
        };

        topLeft.update({ ...handleStyles, x: top.x1, y: top.y1 });
        topRight.update({ ...handleStyles, x: top.x2, y: top.y2 });
        bottomLeft.update({ ...handleStyles, x: bottom.x1, y: bottom.y1 });
        bottomRight.update({ ...handleStyles, x: bottom.x2, y: bottom.y2 });
        topMiddle.update({
            ...handleStyles,
            x: top.x1 + (top.x2 - top.x1) / 2 - topMiddle.handle.width / 2,
            y: top.y1 + (top.y2 - top.y1) / 2 - topMiddle.handle.height / 2,
        });
        bottomMiddle.update({
            ...handleStyles,
            x: bottom.x1 + (bottom.x2 - bottom.x1) / 2 - bottomMiddle.handle.width / 2,
            y: bottom.y1 + (bottom.y2 - bottom.y1) / 2 - bottomMiddle.handle.height / 2,
        });
    }

    override updateText(datum: ParallelChannelProperties, top: LineCoords, bottom: LineCoords) {
        if (!datum.text && this.text) {
            this.removeChild(this.text);
        }

        if (!datum.text) return;

        if (this.text == null) {
            this.text = new _Scene.TransformableText();
            this.appendChild(this.text);
        }

        const { alignment, position } = datum.text;

        let relativeLine = top;
        if (position === 'bottom') {
            relativeLine = bottom;
        } else if (position === 'inside') {
            relativeLine = {
                x1: (top.x1 + bottom.x1) / 2,
                y1: (top.y1 + bottom.y1) / 2,
                x2: (top.x2 + bottom.x2) / 2,
                y2: (top.y2 + bottom.y2) / 2,
            };
        }
        const [start, end] = Vec2.from(relativeLine);
        const [left, right] = start.x <= end.x ? [start, end] : [end, start];
        const normal = Vec2.normalized(Vec2.sub(right, left));
        const angle = Vec2.angle(normal);

        const inset = Vec2.multiply(normal, (datum.strokeWidth ?? 2) + 13);
        const offset = Vec2.multiply(normal, (datum.strokeWidth ?? 2) + 3);

        let point = left;
        if (alignment === 'left' && position === 'inside') {
            point = Vec2.add(left, inset);
        } else if (alignment === 'right' && position === 'inside') {
            point = Vec2.sub(right, inset);
        } else if (alignment === 'right') {
            point = right;
        } else if (alignment === 'center') {
            point = Vec2.add(left, Vec2.multiply(normal, Vec2.distance(left, right) / 2));
        }

        let textBaseline: CanvasTextBaseline = 'bottom';
        if (position === 'bottom') {
            point = Vec2.rotate(offset, angle + Math.PI / 2, point);
            textBaseline = 'top';
        } else {
            point = Vec2.rotate(offset, angle - Math.PI / 2, point);
        }

        this.text.setProperties({
            text: datum.text.label,

            x: point.x,
            y: point.y,
            rotation: Vec2.angle(normal),
            rotationCenterX: point.x,
            rotationCenterY: point.y,

            fill: datum.text.color,
            fontFamily: datum.text.fontFamily,
            fontSize: datum.text.fontSize,
            fontStyle: datum.text.fontStyle,
            fontWeight: datum.text.fontWeight,
            textAlign: datum.text.alignment,
            textBaseline: textBaseline,
        });
    }
}
