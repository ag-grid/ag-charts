import { type PixelSize, _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

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
import { AnnotationType } from '../annotationTypes';
import { Channel } from '../properties/channelProperties';

const { NUMBER, STRING, OBJECT, BaseProperties, Validate, isObject } = _ModuleSupport;

export class ParallelChannelProperties extends Channel(
    Annotation(Background(Line(Handle(Extendable(Stroke(LineStyle(BaseProperties)))))))
) {
    static is(value: unknown): value is ParallelChannelProperties {
        return isObject(value) && value.type === AnnotationType.ParallelChannel;
    }

    @Validate(STRING)
    type = AnnotationType.ParallelChannel as const;

    @Validate(NUMBER)
    height!: number;

    @Validate(OBJECT, { optional: true })
    middle = new ChannelAnnotationMiddleProperties();

    @Validate(OBJECT, { optional: true })
    text = new ChannelTextProperties();

    get bottom() {
        const bottom = {
            start: { x: this.start.x, y: this.start.y },
            end: { x: this.end.x, y: this.end.y },
        };

        if (typeof bottom.start.y === 'number' && typeof bottom.end.y === 'number') {
            bottom.start.y -= this.height;
            bottom.end.y -= this.height;
        } else {
            _Util.Logger.warnOnce(`Annotation [${this.type}] can only be used with a numeric y-axis.`);
        }

        return bottom;
    }
}
