import { _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { invertCoords, validateDatumPoint } from '../annotationUtils';
import { Annotation } from '../scenes/annotation';
import { ChannelScene } from '../scenes/channelScene';
import { DivariantHandle, UnivariantHandle } from '../scenes/handle';
import type { ParallelChannelAnnotation } from './parallelChannelProperties';

const { Vec2 } = _Util;

type ChannelHandle = keyof ParallelChannel['handles'];

export class ParallelChannel extends ChannelScene<ParallelChannelAnnotation> {
    static override is(value: unknown): value is ParallelChannel {
        return Annotation.isCheck(value, 'parallel-channel');
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

    override dragHandle(
        datum: ParallelChannelAnnotation,
        target: Coords,
        context: AnnotationContext,
        onInvalid: () => void
    ) {
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
            onInvalid();
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
            onInvalid();
        }
    }

    override updateLines(datum: ParallelChannelAnnotation, top: LineCoords, bottom: LineCoords) {
        const { topLine, middleLine, bottomLine } = this;
        const { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = datum;

        const lineStyles = { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth };

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

    override updateHandles(datum: ParallelChannelAnnotation, top: LineCoords, bottom: LineCoords) {
        const {
            handles: { topLeft, topMiddle, topRight, bottomLeft, bottomMiddle, bottomRight },
        } = this;

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
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
}
