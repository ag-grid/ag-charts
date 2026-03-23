import type { _ModuleSupport } from 'ag-charts-community';
import { type Bounds4, type Point, Vec2 } from 'ag-charts-core';

import type { ChannelTextProperties, LineTextProperties } from '../annotationProperties';
import type { CollidableLine } from '../scenes/collidableLineScene';
import { CollidableText } from '../scenes/collidableTextScene';
import { DivariantHandle } from '../scenes/handle';

interface Numbers {
    left: Point;
    right: Point;
    inset: Point;
    offset: Point;
    normal: Point;
    angle: number;
}

export function updateLineText(
    id: string,
    line: CollidableLine,
    coords: Bounds4,
    textProperties?: Partial<LineTextProperties>,
    textNode?: CollidableText,
    text?: string,
    lineWidth?: number
) {
    if (!text || !textNode || !textProperties) {
        line.setClipMask(id);
        return;
    }

    const { alignment, position } = textProperties;
    const numbers = getNumbers(coords, textProperties.fontSize, lineWidth);
    const { point, textBaseline } = positionAndAlignment(numbers, position, alignment);
    setProperties(textNode, text, textProperties, point, numbers.angle, textBaseline);

    const { x, y, width, height } = textNode.getBBox();
    const diameter = Vec2.length(Vec2.from(width, height));
    const clipMask = {
        x: x + width / 2,
        y: y + height / 2,
        radius: diameter / 2 + Vec2.length(numbers.offset),
    };

    if (position === 'center') {
        line.setClipMask(id, clipMask);
    } else {
        line.setClipMask(id);
    }

    return { clipMask, numbers };
}

export function updateChannelText(
    offsetInsideTextLabel: boolean,
    top: Bounds4,
    bottom: Bounds4,

    textProperties: ChannelTextProperties,
    lineWidth?: number,

    textNode?: CollidableText,
    text?: string
) {
    if (!text || !textNode) return;

    const { alignment, position } = textProperties;

    const [actualTop, actualBottom] = top.y1 <= bottom.y1 ? [top, bottom] : [bottom, top];

    let relativeLine = actualTop;
    if (position === 'bottom') {
        relativeLine = actualBottom;
    } else if (position === 'inside') {
        relativeLine = {
            x1: (actualTop.x1 + actualBottom.x1) / 2,
            y1: (actualTop.y1 + actualBottom.y1) / 2,
            x2: (actualTop.x2 + actualBottom.x2) / 2,
            y2: (actualTop.y2 + actualBottom.y2) / 2,
        };
    }

    const numbers = getNumbers(relativeLine, textProperties.fontSize, lineWidth);
    const { point, textBaseline } = positionAndAlignment(
        numbers,
        position === 'inside' ? 'center' : position,
        alignment,
        offsetInsideTextLabel
    );

    setProperties(textNode, text, textProperties, point, numbers.angle, textBaseline);
}

function getNumbers(coords: Bounds4, fontSize?: number, strokeWidth?: number): Numbers {
    let [left, right] = Vec2.from(coords);
    if (left.x > right.x) [left, right] = [right, left];

    const normal = Vec2.normalized(Vec2.sub(right, left));
    const angle = Vec2.angle(normal);

    // Inset from the end of the line
    const inset = Vec2.multiply(normal, DivariantHandle.HANDLE_SIZE / 2 + (fontSize ?? 14) / 2);

    // Offset above or below the line, and within when over the line and clipping
    const offset = Vec2.multiply(normal, (strokeWidth ?? 2) / 2 + (fontSize ?? 14) / 3);

    return { left, right, normal, angle, inset, offset };
}

function positionAndAlignment(
    { left, right, normal, angle, inset, offset }: Numbers,
    position?: 'top' | 'center' | 'bottom',
    alignment?: 'left' | 'center' | 'right',
    offsetInsideTextLabel?: boolean
) {
    let point: Point;
    if (alignment === 'right') {
        point = Vec2.sub(right, inset);
    } else if (alignment === 'center') {
        point = Vec2.add(left, Vec2.multiply(normal, Vec2.distance(left, right) / 2));
    } else {
        point = Vec2.add(left, inset);
    }

    let textBaseline: CanvasTextBaseline = 'bottom';
    if (position === 'bottom') {
        point = Vec2.rotate(offset, angle + Math.PI / 2, point);
        textBaseline = 'top';
    } else if (position === 'center' && !offsetInsideTextLabel) {
        textBaseline = 'middle';
    } else {
        point = Vec2.rotate(offset, angle - Math.PI / 2, point);
    }

    return { point, textBaseline };
}

function setProperties(
    scene: _ModuleSupport.TransformableText,
    text: string,
    textProperties: Partial<LineTextProperties> | Partial<ChannelTextProperties>,
    point: Point,
    angle: number,
    textBaseline: CanvasTextBaseline
) {
    scene.setProperties({
        text,

        x: point.x,
        y: point.y,
        rotation: angle,
        rotationCenterX: point.x,
        rotationCenterY: point.y,

        fill: textProperties.color,
        fontFamily: textProperties.fontFamily,
        fontSize: textProperties.fontSize,
        fontStyle: textProperties.fontStyle,
        fontWeight: textProperties.fontWeight,
        textAlign: textProperties.alignment,
        textBaseline: textBaseline,
    });
}
