import { type PixelSize, _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import {
    Annotation,
    Background,
    ChannelTextProperties,
    Extendable,
    Handle,
    Line,
    LineStyle,
    Stroke,
} from '../annotationProperties';
import { type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { getLineCap, getLineDash } from '../utils/line';

const { NUMBER, OBJECT, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class DisjointChannelProperties extends Annotation(
    Background(Line(Handle(Extendable(Stroke(LineStyle(BaseProperties))))))
) {
    static is(value: unknown): value is DisjointChannelProperties {
        return isObject(value) && value.type === AnnotationType.DisjointChannel;
    }

    @Validate(STRING)
    type = AnnotationType.DisjointChannel as const;

    @Validate(NUMBER)
    startHeight!: number;

    @Validate(NUMBER)
    endHeight!: number;

    @Validate(NUMBER)
    snapToAngle: number = 45;

    @Validate(OBJECT, { optional: true })
    text = new ChannelTextProperties();

    get bottom() {
        const bottom = {
            start: { x: this.start.x, y: this.start.y },
            end: { x: this.end.x, y: this.end.y },
        };

        if (typeof bottom.start.y === 'number' && typeof bottom.end.y === 'number') {
            bottom.start.y -= this.startHeight;
            bottom.end.y -= this.endHeight;
        } else {
            _Util.Logger.warnOnce(`Annotation [${this.type}] can only be used with a numeric y-axis.`);
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

    getLineCap(): _Scene.ShapeLineCap | undefined {
        return getLineCap(this.lineCap, this.lineDash, this.lineStyle);
    }
}
