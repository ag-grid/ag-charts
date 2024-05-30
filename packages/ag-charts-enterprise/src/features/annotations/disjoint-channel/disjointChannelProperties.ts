import { _ModuleSupport, _Util } from 'ag-charts-community';

import {
    Annotation,
    AnnotationHandle,
    AnnotationLine,
    ChannelAnnotation,
    LineDash,
    Stroke,
} from '../annotationProperties';
import { AnnotationType } from '../annotationTypes';

const { NUMBER, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class DisjointChannelAnnotation extends Annotation(
    AnnotationType.DisjointChannel,
    ChannelAnnotation(AnnotationLine(AnnotationHandle(Stroke(LineDash(BaseProperties)))))
) {
    static is(value: unknown): value is DisjointChannelAnnotation {
        return isObject(value) && value.type === AnnotationType.DisjointChannel;
    }

    @Validate(STRING)
    type = AnnotationType.DisjointChannel as const;

    @Validate(NUMBER)
    startHeight!: number;

    @Validate(NUMBER)
    endHeight!: number;

    get bottom() {
        const bottom = {
            start: { x: this.start.x, y: this.start.y },
            end: { x: this.end.x, y: this.end.y },
        };

        if (typeof bottom.start.y === 'number' && typeof bottom.end.y === 'number') {
            bottom.start.y -= this.startHeight;
            bottom.end.y -= this.endHeight;
        } else {
            // TODO
            _Util.Logger.warnOnce(`Annotation [${this.type}] can only be used with a numeric y-axis.`);
        }

        return bottom;
    }
}
