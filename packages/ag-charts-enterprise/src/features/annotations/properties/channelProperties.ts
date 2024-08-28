import type { LineDashOptions, PixelSize, StrokeOptions, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationInterface, BackgroundInterface, LineInterface } from '../annotationProperties';
import type { AnnotationContext, AnnotationOptionsColorPickerType, Constructor, Point } from '../annotationTypes';
import { validateDatumLine } from '../utils/validation';

export function Channel<
    T extends Constructor<
        _ModuleSupport.BaseProperties &
            AnnotationInterface &
            LineInterface &
            BackgroundInterface &
            StrokeOptions &
            LineDashOptions
    >,
>(Parent: T) {
    abstract class ChannelInternal extends Parent {
        lineCap?: _Scene.ShapeLineCap = undefined;
        computedLineDash?: PixelSize[] = undefined;

        abstract get bottom(): { start: Point; end: Point };

        override isValidWithContext(context: AnnotationContext, warningPrefix?: string) {
            return (
                super.isValid(warningPrefix) &&
                validateDatumLine(context, this, warningPrefix) &&
                validateDatumLine(context, this.bottom, warningPrefix)
            );
        }

        override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
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
    return ChannelInternal;
}
