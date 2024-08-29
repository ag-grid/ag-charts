import { type PixelSize, _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import {
    Annotation,
    Background,
    ChannelTextProperties,
    Handle,
    Line,
    LineStyle,
    Stroke,
} from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { validateDatumLine } from '../utils/validation';

const { NUMBER, OBJECT, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class DisjointChannelProperties extends Annotation(Background(Line(Handle(Stroke(LineStyle(BaseProperties)))))) {
    static is(value: unknown): value is DisjointChannelProperties {
        return isObject(value) && value.type === AnnotationType.DisjointChannel;
    }

    @Validate(STRING)
    type = AnnotationType.DisjointChannel as const;

    @Validate(NUMBER)
    startHeight!: number;

    @Validate(NUMBER)
    endHeight!: number;

    @Validate(OBJECT, { optional: true })
    text = new ChannelTextProperties();

    lineCap?: _Scene.ShapeLineCap = undefined;
    computedLineDash?: PixelSize[] = undefined;

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

    override isValidWithContext(context: AnnotationContext, warningPrefix?: string) {
        return (
            super.isValid(warningPrefix) &&
            validateDatumLine(context, this, warningPrefix) &&
            validateDatumLine(context, this.bottom, warningPrefix)
        );
    }

    getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.background.fill;
            case `line-color`:
                return this.stroke;
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
        return this.lineDash ?? this.computedLineDash;
    }
}
