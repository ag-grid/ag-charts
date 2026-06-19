import { _ModuleSupport } from 'ag-charts-community';
import { type NormalisedStrokeOptions, Vec2 } from 'ag-charts-core';

export abstract class CapScene extends _ModuleSupport.Group {
    abstract type: string;

    abstract update(options: { x: number; y: number; angle: number } & NormalisedStrokeOptions): void;
}

export class ArrowCapScene extends CapScene {
    override type = 'arrow' as const;

    private readonly path = new _ModuleSupport.Path();
    private readonly armLength = 6;

    constructor() {
        super();
        this.append([this.path]);
    }

    update(options: { x: number; y: number; angle: number } & NormalisedStrokeOptions) {
        const { path } = this;
        const { x, y, angle, ...rest } = options;

        const origin = Vec2.from(x, y);
        const offsetAngle = (3 * Math.PI) / 4;
        const armLength = this.armLength + (options.strokeWidth ?? 0) * 2;

        const leftEnd = Vec2.rotate(Vec2.from(0, armLength), angle + offsetAngle, origin);
        const rightEnd = Vec2.rotate(Vec2.from(armLength, 0), angle - offsetAngle, origin);

        path.setProperties(rest);
        path.fillOpacity = 0;

        path.path.clear();
        path.path.moveTo(leftEnd.x, leftEnd.y);
        path.path.lineTo(origin.x, origin.y);
        path.path.lineTo(rightEnd.x, rightEnd.y);
    }
}
