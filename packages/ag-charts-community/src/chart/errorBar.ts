import { OPT_STRING, Validate } from '../util/validation';

import { Path } from '../scene/shape/path';
import type { Point } from '../scene/point';

export interface ErrorBarPoints {
    readonly yLowerPoint: Point;
    readonly yUpperPoint: Point;
}

export class ErrorBarConfig {
    @Validate(OPT_STRING)
    yLowerKey: string = '';

    @Validate(OPT_STRING)
    yLowerName?: string = undefined;

    @Validate(OPT_STRING)
    yUpperKey: string = '';

    @Validate(OPT_STRING)
    yUpperName?: string = undefined;

    constructor(yLowerKey: string, yUpperKey: string) {
        this.yLowerKey = yLowerKey;
        this.yUpperKey = yUpperKey;
    }
}

export class ErrorBar extends Path {
    public points: ErrorBarPoints = { yLowerPoint: { x: 0, y: 0 }, yUpperPoint: { x: 0, y: 0 } };

    updatePath() {
        // TODO(olegat) implement, this is just placeholder draw code
        const { path } = this;
        this.fill = 'black';
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.fillOpacity = 1;
        this.strokeOpacity = 1;

        const { yLowerPoint, yUpperPoint } = this.points;

        path.clear();
        path.moveTo(yLowerPoint.x, yLowerPoint.y);
        path.lineTo(yUpperPoint.x, yUpperPoint.y);
        path.closePath();
    }
}
