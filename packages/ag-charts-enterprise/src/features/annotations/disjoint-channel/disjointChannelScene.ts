import { type Bounds4, type Point, Vec2, Vec4 } from 'ag-charts-core';

import type { AnnotationContext } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { ChannelScene } from '../scenes/channelScene';
import { CollidableText } from '../scenes/collidableTextScene';
import { DivariantHandle, UnivariantHandle } from '../scenes/handle';
import { translate } from '../utils/coords';
import { updateChannelText } from '../utils/lineWithText';
import { convertLine } from '../utils/values';
import type { DisjointChannelProperties } from './disjointChannelProperties';

type ChannelHandle = keyof DisjointChannelScene['handles'];

export class DisjointChannelScene extends ChannelScene<DisjointChannelProperties> {
    static override is(value: unknown): value is DisjointChannelScene {
        return AnnotationScene.isCheck(value, 'disjoint-channel');
    }

    type = 'disjoint-channel';

    override activeHandle?: ChannelHandle;
    override handles = {
        topLeft: new DivariantHandle(),
        topRight: new DivariantHandle(),
        bottomLeft: new DivariantHandle(),
        bottomRight: new UnivariantHandle(),
    };

    constructor() {
        super();
        this.append([this.background, this.topLine, this.bottomLine, ...Object.values(this.handles)]);
    }

    override dragHandle(
        datum: DisjointChannelProperties,
        target: Point,
        context: AnnotationContext,
        snapping: boolean
    ) {
        const { activeHandle, handles } = this;
        if (activeHandle == null) return;

        const { offset } = handles[activeHandle].drag(target);
        handles[activeHandle].toggleDragging(true);

        if (activeHandle === 'bottomRight') {
            offset.x = 0;
        }

        let translateVectors: Array<ChannelHandle> = [];
        let invertYVectors: Array<ChannelHandle> = [];
        let allowSnapping = snapping;

        switch (activeHandle) {
            case 'topLeft':
                translateVectors = ['topLeft'];
                invertYVectors = ['bottomLeft'];
                break;
            case 'bottomLeft':
                translateVectors = ['bottomLeft'];
                invertYVectors = ['topLeft'];
                break;
            case 'topRight':
                translateVectors = ['topRight'];
                invertYVectors = ['bottomRight'];
                break;
            case 'bottomRight':
                translateVectors = ['bottomLeft', 'bottomRight'];
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
            invertYVectors,
            snap: allowSnapping ? snap : undefined,
        });

        datum.start.x = points.topLeft.x;
        datum.start.y = points.topLeft.y;
        datum.end.x = points.topRight.x;
        datum.end.y = points.topRight.y;
        datum.startHeight = points.topLeft.y - points.bottomLeft.y;
        datum.endHeight = points.topRight.y - points.bottomRight.y;
    }

    protected override getTranslatePointsVectors(start: Point, end: Point) {
        const { bottomLeft, bottomRight, topLeft, topRight } = this.handles;
        const startHeight = bottomLeft.getBBox().y - topLeft.getBBox().y;
        const endHeight = bottomRight.getBBox().y - topRight.getBBox().y;
        const bottomStart = Vec2.add(start, Vec2.from(0, startHeight));
        const bottomEnd = Vec2.add(end, Vec2.from(0, endHeight));

        return { start, end, bottomStart, bottomEnd };
    }

    override updateLines(datum: DisjointChannelProperties, top: Bounds4, bottom: Bounds4) {
        const { topLine, bottomLine } = this;
        const { lineDashOffset, stroke, strokeOpacity, strokeWidth } = datum;

        const lineStyles = {
            lineCap: datum.getLineCap(),
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeOpacity,
            strokeWidth,
        };

        topLine.setProperties({ ...top, ...lineStyles });
        bottomLine.setProperties({ ...bottom, ...lineStyles });
    }

    override updateHandles(datum: DisjointChannelProperties, top: Bounds4, bottom: Bounds4) {
        const {
            handles: { topLeft, topRight, bottomLeft, bottomRight },
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
        bottomRight.update({
            ...handleStyles,
            ...Vec2.sub(Vec4.end(bottom), Vec2.from(bottomRight.handle.width / 2, bottomRight.handle.height / 2)),
        });
    }

    updateText(datum: DisjointChannelProperties, top: Bounds4, bottom: Bounds4) {
        this.text = this.updateNode(CollidableText, this.text, !!datum.text.label);

        updateChannelText(false, top, bottom, datum.text, datum.strokeWidth, this.text, datum.text.label);
    }

    override getBackgroundPoints(datum: DisjointChannelProperties, top: Bounds4, bottom: Bounds4, bounds: Bounds4) {
        const isFlippedX = top.x1 > top.x2;
        const isFlippedY = top.y1 > top.y2;
        const topY = isFlippedY ? bounds.y2 : bounds.y1;
        const bottomY = isFlippedY ? bounds.y1 : bounds.y2;

        const points = Vec2.from(top);

        if (datum.extendEnd && top.y2 === bottomY) {
            points.push(Vec2.from(isFlippedX ? bounds.x1 : bounds.x2, isFlippedY ? bounds.y1 : bounds.y2));
        }

        if (datum.extendEnd && bottom.y2 === topY) {
            points.push(Vec2.from(isFlippedX ? bounds.x1 : bounds.x2, isFlippedY ? bounds.y2 : bounds.y1));
        }

        points.push(...Vec2.from(bottom).reverse());

        if (datum.extendStart && bottom.y1 === bottomY) {
            points.push(Vec2.from(isFlippedX ? bounds.x2 : bounds.x1, isFlippedY ? bounds.y1 : bounds.y2));
        }

        if (datum.extendStart && top.y1 === topY) {
            points.push(Vec2.from(isFlippedX ? bounds.x2 : bounds.x1, isFlippedY ? bounds.y2 : bounds.y1));
        }

        return points;
    }
}
