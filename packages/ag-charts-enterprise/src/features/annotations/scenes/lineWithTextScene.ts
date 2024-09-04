import { _Scene, _Util } from 'ag-charts-community';

import type { ChannelTextProperties, LineTextProperties } from '../annotationProperties';
import type { LineCoords } from '../annotationTypes';
import type { AnnotationScene } from './annotationScene';
import type { CollidableLine } from './collidableLineScene';
import { DivariantHandle } from './handle';

const { Vec2 } = _Util;

interface Numbers {
    left: _Util.Vec2;
    right: _Util.Vec2;
    inset: _Util.Vec2;
    offset: _Util.Vec2;
    normal: _Util.Vec2;
    angle: number;
}

export class LineWithTextScene {
    static updateLineText<Datum extends { strokeWidth?: number; text?: LineTextProperties }>(
        this: AnnotationScene & { line: CollidableLine; text?: _Scene.TransformableText },
        datum: Datum,
        coords: LineCoords
    ) {
        if (!datum.text?.label && this.text) {
            this.removeChild(this.text);
            this.line.setClipMask();
            this.text = undefined;
        }

        if (!datum.text?.label) return;

        if (this.text == null) {
            this.text = new _Scene.TransformableText();
            this.appendChild(this.text);
        }

        const { alignment, position } = datum.text;

        const numbers = LineWithTextScene.getNumbers(coords, datum.text.fontSize, datum.strokeWidth);
        const { point, textBaseline } = LineWithTextScene.positionAndAlignment(numbers, position, alignment);
        LineWithTextScene.setProperties(this.text, datum.text, point, numbers.angle, textBaseline);

        if (position === 'center') {
            const { x, y, width, height } = this.text.getBBox();
            const diameter = Vec2.length(Vec2.from(width, height));
            this.line.setClipMask({
                x: x + width / 2,
                y: y + height / 2,
                radius: diameter / 2 + Vec2.length(numbers.offset),
            });
        } else {
            this.line.setClipMask();
        }
    }

    static updateChannelText<Datum extends { strokeWidth?: number; text?: ChannelTextProperties }>(
        this: AnnotationScene & { text?: _Scene.TransformableText },
        offsetInsideTextLabel: boolean,
        datum: Datum,
        top: LineCoords,
        bottom: LineCoords
    ) {
        if (!datum.text?.label && this.text) {
            this.removeChild(this.text);
            this.text = undefined;
        }

        if (!datum.text?.label) return;

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

        const numbers = LineWithTextScene.getNumbers(relativeLine, datum.text.fontSize, datum.strokeWidth);
        const { point, textBaseline } = LineWithTextScene.positionAndAlignment(
            numbers,
            position === 'inside' ? 'center' : position,
            alignment,
            offsetInsideTextLabel
        );
        LineWithTextScene.setProperties(this.text, datum.text, point, numbers.angle, textBaseline);
    }

    static getNumbers(coords: LineCoords, fontSize?: number, strokeWidth?: number): Numbers {
        let [left, right] = Vec2.from(coords);
        if (left.x > right.x) [left, right] = [right, left];

        const fontOffset = (fontSize ?? 14) / 3;

        const normal = Vec2.normalized(Vec2.sub(right, left));
        const angle = Vec2.angle(normal);
        const inset = Vec2.multiply(normal, DivariantHandle.HANDLE_SIZE / 2 + fontOffset);
        const offset = Vec2.multiply(normal, (strokeWidth ?? 2) / 2 + fontOffset);

        return { left, right, normal, angle, inset, offset };
    }

    static positionAndAlignment(
        { left, right, normal, angle, inset, offset }: Numbers,
        position?: 'top' | 'center' | 'bottom',
        alignment?: 'left' | 'center' | 'right',
        offsetInsideTextLabel?: boolean
    ) {
        let point: _Util.Vec2;
        if (alignment === 'right') {
            point = Vec2.sub(right, inset);
        } else if (alignment === 'center') {
            point = Vec2.add(left, Vec2.multiply(normal, Vec2.distance(left, right) / 2));
        } else {
            point = Vec2.add(left, inset);
        }

        let textBaseline: CanvasTextBaseline = 'middle';
        if (position === 'top' || offsetInsideTextLabel) {
            point = Vec2.rotate(offset, angle - Math.PI / 2, point);
            textBaseline = 'bottom';
        } else if (position === 'bottom') {
            point = Vec2.rotate(offset, angle + Math.PI / 2, point);
            textBaseline = 'top';
        }

        return { point, textBaseline };
    }

    static setProperties(
        scene: _Scene.TransformableText,
        datum: LineTextProperties | ChannelTextProperties,
        point: _Util.Vec2,
        angle: number,
        textBaseline: CanvasTextBaseline
    ) {
        scene.setProperties({
            text: datum.label,

            x: point.x,
            y: point.y,
            rotation: angle,
            rotationCenterX: point.x,
            rotationCenterY: point.y,

            fill: datum.color,
            fontFamily: datum.fontFamily,
            fontSize: datum.fontSize,
            fontStyle: datum.fontStyle,
            fontWeight: datum.fontWeight,
            textAlign: datum.alignment,
            textBaseline: textBaseline,
        });
    }
}