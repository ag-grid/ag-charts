import { type ColorSpace, createSvgElement } from 'ag-charts-core';

import { normalizeAngle360FromDegrees } from 'ag-charts-core/utils/angle';
import type { BBox } from '../bbox';
import { Gradient } from './gradient';
import type { GradientColorStop } from './stops';

export class LinearGradient extends Gradient {
    constructor(
        colorSpace: ColorSpace,
        stops: GradientColorStop[],
        public angle = 0,
        bbox?: BBox
    ) {
        super(colorSpace, stops, bbox);
    }

    private getGradientPoints(bbox: BBox) {
        const angleOffset = 90;
        const { angle } = this;

        const radians = normalizeAngle360FromDegrees(angle + angleOffset);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const w = bbox.width;
        const h = bbox.height;
        const cx = bbox.x + w * 0.5;
        const cy = bbox.y + h * 0.5;

        const diagonal = Math.hypot(h, w) / 2;
        const diagonalAngle = Math.atan2(h, w);

        let quarteredAngle: number;
        if (radians < Math.PI / 2) {
            quarteredAngle = radians;
        } else if (radians < Math.PI) {
            quarteredAngle = Math.PI - radians;
        } else if (radians < 1.5 * Math.PI) {
            quarteredAngle = radians - Math.PI;
        } else {
            quarteredAngle = 2 * Math.PI - radians;
        }

        const l = diagonal * Math.abs(Math.cos(quarteredAngle - diagonalAngle));
        return { x0: cx + cos * l, y0: cy + sin * l, x1: cx - cos * l, y1: cy - sin * l };
    }

    protected override createCanvasGradient(ctx: CanvasRenderingContext2D, bbox: BBox): CanvasGradient | undefined {
        const { x0, y0, x1, y1 } = this.getGradientPoints(bbox);
        if (Number.isNaN(x0) || Number.isNaN(y0) || Number.isNaN(x1) || Number.isNaN(y1)) {
            return undefined;
        }
        return ctx.createLinearGradient(x0, y0, x1, y1);
    }

    createSvgGradient(bbox: BBox) {
        const { x0, y0, x1, y1 } = this.getGradientPoints(bbox);

        const gradient = createSvgElement('linearGradient');
        gradient.setAttribute('x1', String(x0));
        gradient.setAttribute('y1', String(y0));
        gradient.setAttribute('x2', String(x1));
        gradient.setAttribute('y2', String(y1));
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
        return gradient;
    }
}
