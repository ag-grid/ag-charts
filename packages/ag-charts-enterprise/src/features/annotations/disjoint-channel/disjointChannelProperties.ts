import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import {
    Annotation,
    Background,
    ChannelTextProperties,
    Handle,
    Line,
    LineStyle,
    Stroke,
} from '../annotationProperties';
import { AnnotationType } from '../annotationTypes';
import { Channel } from '../properties/channelProperties';

const { NUMBER, OBJECT, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class DisjointChannelProperties extends Channel(
    Annotation(Background(Line(Handle(Stroke(LineStyle(BaseProperties))))))
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
}
