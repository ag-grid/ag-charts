import { type Bounds4, type Point, Vec2, Vec4 } from 'ag-charts-core';

import type { AnnotationContext } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { ChannelScene } from '../scenes/channelScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import { CollidableText } from '../scenes/collidableTextScene';
import { DivariantHandle, UnivariantHandle } from '../scenes/handle';
import { translate } from '../utils/coords';
import { updateChannelText } from '../utils/lineWithText';
import { convertLine } from '../utils/values';
import type { ParallelChannelProperties } from './parallelChannelProperties';

type ChannelHandle = keyof ParallelChannelScene['handles'];
type DivariantChannelHandle = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

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

    private readonly middleLine = new CollidableLine();

    constructor() {
        super();
        this.append([this.background, this.topLine, this.middleLine, this.bottomLine, ...Object.values(this.handles)]);
    }

    override dragHandle(
        datum: ParallelChannelProperties,
        target: Point,
        context: AnnotationContext,
        snapping: boolean
    ) {
        const { activeHandle, handles } = this;
        if (activeHandle == null) return;

        const { offset } = handles[activeHandle].drag(target);
        handles[activeHandle].toggleDragging(true);

        if (activeHandle === 'topMiddle' || activeHandle === 'bottomMiddle') {
            offset.x = 0;
        }

        let translateVectors: Array<DivariantChannelHandle> = [];
        let allowSnapping = snapping;

        switch (activeHandle) {
            case 'topLeft':
            case 'bottomLeft':
                translateVectors = ['topLeft', 'bottomLeft'];
                break;
            case 'topMiddle':
                translateVectors = ['topLeft', 'topRight'];
                offset.y -= UnivariantHandle.HANDLE_SIZE / 2;
                allowSnapping = false;
                break;
            case 'topRight':
            case 'bottomRight':
                translateVectors = ['topRight', 'bottomRight'];
                break;
            case 'bottomMiddle':
                translateVectors = ['bottomLeft', 'bottomRight'];
                offset.y -= UnivariantHandle.HANDLE_SIZE / 2;
                allowSnapping = false;
                break;
        }

        const top = convertLine(datum, context);
        const bottom = convertLine(datum.bottom, context);
        if (!top || !bottom) return;

        const vectors = {
            topLeft: Vec4.start(top),
            topRight: Vec4.end(top),
            bottomLeft: Vec4.start(bottom),
            bottomRight: Vec4.end(bottom),
        };

        const snap = {
            vectors: {
                topLeft: vectors.topRight,
                bottomLeft: vectors.bottomRight,
                topRight: vectors.topLeft,
                bottomRight: vectors.bottomLeft,
            },
            angle: datum.snapToAngle,
        };

        const points = translate(vectors, offset, context, {
            overflowContinuous: this.overflowContinuous,
            translateVectors,
            snap: allowSnapping ? snap : undefined,
        });

        datum.start.x = points.topLeft.x;
        datum.start.y = points.topLeft.y;
        datum.end.x = points.topRight.x;
        datum.end.y = points.topRight.y;
        datum.height = points.topLeft.y - points.bottomLeft.y;
    }

    protected override getTranslatePointsVectors(start: Point, end: Point) {
        const { bottomLeft, topLeft } = this.handles;
        const height = bottomLeft.getBBox().y - topLeft.getBBox().y;
        const bottomStart = Vec2.add(start, Vec2.from(0, height));
        const bottomEnd = Vec2.add(end, Vec2.from(0, height));

        return { start, end, bottomStart, bottomEnd };
    }

    override containsPoint(x: number, y: number) {
        return (
            super.containsPoint(x, y) ||
            (this.middleLine.visible && this.middleLine.strokeWidth > 0 && this.middleLine.containsPoint(x, y))
        );
    }

    public override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.middleLine.visible && this.middleLine.strokeWidth > 0 && this.middleLine.containsPoint(x, y))
            return 'line';

        return super.getNodeAtCoords(x, y);
    }

    override updateLines(
        datum: ParallelChannelProperties,
        top: Bounds4,
        bottom: Bounds4,
        context: AnnotationContext,
        naturalTop: Bounds4,
        naturalBottom: Bounds4
    ) {
        const { topLine, middleLine, bottomLine } = this;
        const { lineDashOffset, stroke, strokeOpacity, strokeWidth } = datum;

        const lineDash = datum.getLineDash();

        const lineStyles = {
            lineCap: datum.getLineCap(),
            lineDash,
            lineDashOffset,
            stroke,
            strokeOpacity,
            strokeWidth,
        };

        topLine.setProperties({ ...top, ...lineStyles });
        bottomLine.setProperties({ ...bottom, ...lineStyles });

        const middlePoints = this.extendLine(
            {
                x1: naturalTop.x1,
                y1: naturalBottom.y1 + (naturalTop.y1 - naturalBottom.y1) / 2,
                x2: naturalTop.x2,
                y2: naturalBottom.y2 + (naturalTop.y2 - naturalBottom.y2) / 2,
            },
            datum,
            context
        );

        middleLine.setProperties({
            ...middlePoints,
            lineDash: datum.middle.lineDash ?? lineDash,
            lineDashOffset: datum.middle.lineDashOffset ?? lineDashOffset,
            stroke: datum.middle.stroke ?? stroke,
            strokeOpacity: datum.middle.strokeOpacity ?? strokeOpacity,
            strokeWidth: datum.middle.strokeWidth ?? strokeWidth,
            visible: datum.middle.visible ?? true,
        });
    }

    override updateHandles(datum: ParallelChannelProperties, top: Bounds4, bottom: Bounds4) {
        const {
            handles: { topLeft, topMiddle, topRight, bottomLeft, bottomMiddle, bottomRight },
        } = this;

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? datum.strokeWidth,
        };

        topLeft.update({ ...handleStyles, ...Vec4.start(top) });
        topRight.update({ ...handleStyles, ...Vec4.end(top) });
        bottomLeft.update({ ...handleStyles, ...Vec4.start(bottom) });
        bottomRight.update({ ...handleStyles, ...Vec4.end(bottom) });
        topMiddle.update({
            ...handleStyles,
            ...Vec2.sub(Vec4.center(top), Vec2.from(topMiddle.handle.width / 2, topMiddle.handle.height / 2)),
        });
        bottomMiddle.update({
            ...handleStyles,
            ...Vec2.sub(Vec4.center(bottom), Vec2.from(bottomMiddle.handle.width / 2, bottomMiddle.handle.height / 2)),
        });
    }

    updateText(datum: ParallelChannelProperties, top: Bounds4, bottom: Bounds4) {
        this.text = this.updateNode(CollidableText, this.text, !!datum.text.label);

        updateChannelText(true, top, bottom, datum.text, datum.strokeWidth, this.text, datum.text.label);
    }

    override getBackgroundPoints(datum: ParallelChannelProperties, top: Bounds4, bottom: Bounds4, bounds: Bounds4) {
        const isFlippedX = top.x1 > top.x2;
        const isFlippedY = top.y1 > top.y2;
        const outOfBoundsStart = top.x1 !== bottom.x1 && top.y1 !== bottom.y1;
        const outOfBoundsEnd = top.x2 !== bottom.x2 && top.y2 !== bottom.y2;

        const points = Vec2.from(top);

        if (datum.extendEnd && outOfBoundsEnd) {
            points.push(Vec2.from(isFlippedX ? bounds.x1 : bounds.x2, isFlippedY ? bounds.y1 : bounds.y2));
        }

        points.push(...Vec2.from(bottom).reverse());

        if (datum.extendStart && outOfBoundsStart) {
            points.push(Vec2.from(isFlippedX ? bounds.x2 : bounds.x1, isFlippedY ? bounds.y2 : bounds.y1));
        }

        return points;
    }
}
