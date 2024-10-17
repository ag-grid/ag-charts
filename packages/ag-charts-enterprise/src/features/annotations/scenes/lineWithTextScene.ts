import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { ChannelTextProperties, LineTextProperties } from '../annotationProperties';
import type { AnnotationScene } from './annotationScene';
import type { CollidableLine } from './collidableLineScene';
import { CollidableText } from './collidableTextScene';
import { DivariantHandle } from './handle';

const { Vec2 } = _ModuleSupport;

interface Numbers {
    left: _ModuleSupport.Vec2;
    right: _ModuleSupport.Vec2;
    inset: _ModuleSupport.Vec2;
    offset: _ModuleSupport.Vec2;
    normal: _ModuleSupport.Vec2;
    angle: number;
}

export class LineWithTextScene {
    static updateLineText<Datum extends { strokeWidth?: number; text?: LineTextProperties }>(
        this: AnnotationScene & { text?: CollidableText },
        line: CollidableLine,
        datum: Datum,
        coords: _ModuleSupport.Vec4
    ) {
        if (!datum.text?.label && this.text) {
            this.removeChild(this.text);
            line.setClipMask();
            this.text = undefined;
        }

        if (!datum.text?.label) return;

        if (this.text == null) {
            this.text = new CollidableText();
            this.appendChild(this.text);
        }

        const { alignment, position } = datum.text;

        const numbers = LineWithTextScene.getNumbers(coords, datum.text.fontSize, datum.strokeWidth);
        const { point, textBaseline } = LineWithTextScene.positionAndAlignment(numbers, position, alignment);
        LineWithTextScene.setProperties(this.text, datum.text, point, numbers.angle, textBaseline);

        const { x, y, width, height } = this.text.getBBox();
        const diameter = Vec2.length(Vec2.from(width, height));
        const clipMask = {
            x: x + width / 2,
            y: y + height / 2,
            radius: diameter / 2 + Vec2.length(numbers.offset),
        };

        if (position === 'center') {
            line.setClipMask(clipMask);
        } else {
            line.setClipMask();
        }

        return { clipMask, numbers };
    }

    static updateChannelText<Datum extends { strokeWidth?: number; text?: ChannelTextProperties }>(
        this: AnnotationScene & { text?: _Scene.TransformableText },
        offsetInsideTextLabel: boolean,
        datum: Datum,
        top: _ModuleSupport.Vec4,
        bottom: _ModuleSupport.Vec4
    ) {
        if (!datum.text?.label && this.text) {
            this.removeChild(this.text);
            this.text = undefined;
        }

        if (!datum.text?.label) return;

        if (this.text == null) {
            this.text = new CollidableText();
            this.appendChild(this.text);
        }

        const { alignment, position } = datum.text;

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

        const numbers = LineWithTextScene.getNumbers(relativeLine, datum.text.fontSize, datum.strokeWidth);
        const { point, textBaseline } = LineWithTextScene.positionAndAlignment(
            numbers,
            position === 'inside' ? 'center' : position,
            alignment,
            offsetInsideTextLabel
        );
        LineWithTextScene.setProperties(this.text, datum.text, point, numbers.angle, textBaseline);
    }

    static getNumbers(coords: _ModuleSupport.Vec4, fontSize?: number, strokeWidth?: number): Numbers {
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

    static positionAndAlignment(
        { left, right, normal, angle, inset, offset }: Numbers,
        position?: 'top' | 'center' | 'bottom',
        alignment?: 'left' | 'center' | 'right',
        offsetInsideTextLabel?: boolean
    ) {
        let point: _ModuleSupport.Vec2;
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

    static setProperties(
        scene: _Scene.TransformableText,
        datum: LineTextProperties | ChannelTextProperties,
        point: _ModuleSupport.Vec2,
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
