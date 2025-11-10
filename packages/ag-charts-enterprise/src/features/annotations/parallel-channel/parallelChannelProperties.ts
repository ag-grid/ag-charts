import { type PixelSize, _ModuleSupport } from 'ag-charts-community';
import { Logger, isObject, Property, BaseProperties} from 'ag-charts-core';

import {
    Annotation,
    Background,
    ChannelAnnotationMiddleProperties,
    ChannelTextProperties,
    Extendable,
    Handle,
    Line,
    LineStyle,
    Stroke,
} from '../annotationProperties';
import { type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { getLineCap, getLineDash } from '../utils/line';


export class ParallelChannelProperties extends Annotation(
    Background(Line(Handle(Extendable(Stroke(LineStyle(BaseProperties))))))
) {
    static is(this: void, value: unknown): value is ParallelChannelProperties {
        return isObject(value) && value.type === AnnotationType.ParallelChannel;
    }

    @Property
    type = AnnotationType.ParallelChannel as const;

    @Property
    height!: number;

    @Property
    middle = new ChannelAnnotationMiddleProperties();

    @Property
    text = new ChannelTextProperties();

    snapToAngle: number = 45;

    get bottom() {
        const bottom = {
            start: { x: this.start.x, y: this.start.y },
            end: { x: this.end.x, y: this.end.y },
        };

        if (typeof bottom.start.y === 'number' && typeof bottom.end.y === 'number') {
            bottom.start.y -= this.height;
            bottom.end.y -= this.height;
        } else {
            Logger.warnOnce(`Annotation [${this.type}] can only be used with a numeric y-axis.`);
        }

        return bottom;
    }

    getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.background.fill;
            case `line-color`:
                return this.stroke;
            case 'text-color':
                return this.text.color;
        }
    }

    getDefaultOpacity(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.background.fillOpacity;
            case `line-color`:
                return this.strokeOpacity;
        }
    }

    getLineDash(): PixelSize[] | undefined {
        return getLineDash(this.lineDash, this.computedLineDash, this.lineStyle, this.strokeWidth);
    }

    getLineCap(): _ModuleSupport.ShapeLineCap | undefined {
        return getLineCap(this.lineCap, this.lineDash, this.lineStyle);
    }
}
