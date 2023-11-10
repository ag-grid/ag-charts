import { isPointInSector } from '../../util/sector';
import { BBox } from '../bbox';
import { Path, ScenePathChangeDetection } from './path';

export class Sector extends Path {
    static override className = 'Sector';

    @ScenePathChangeDetection()
    centerX: number = 0;

    @ScenePathChangeDetection()
    centerY: number = 0;

    @ScenePathChangeDetection()
    innerRadius: number = 10;

    @ScenePathChangeDetection()
    outerRadius: number = 20;

    @ScenePathChangeDetection()
    startAngle: number = 0;

    @ScenePathChangeDetection()
    endAngle: number = Math.PI * 2;

    @ScenePathChangeDetection()
    angleOffset: number = 0;

    @ScenePathChangeDetection()
    inset: number = 0;

    override computeBBox(): BBox {
        const radius = this.outerRadius;
        return new BBox(this.centerX - radius, this.centerY - radius, radius * 2, radius * 2);
    }

    override updatePath(): void {
        const path = this.path;

        const { angleOffset, inset } = this;
        const startAngle = this.startAngle + angleOffset;
        const endAngle = this.endAngle + angleOffset;
        const fullPie = Math.abs(this.endAngle - this.startAngle) >= 2 * Math.PI;
        const centerX = this.centerX;
        const centerY = this.centerY;

        path.clear();

        if (fullPie) {
            const baseInnerRadius = this.innerRadius <= 0 ? 0 : this.innerRadius + inset;
            const innerRadius = Math.min(baseInnerRadius, this.outerRadius - inset);
            const outerRadius = Math.max(baseInnerRadius, this.outerRadius - inset);

            path.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            if (innerRadius > 0) {
                path.moveTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
                path.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            }
        } else {
            const innerRadius = Math.min(this.innerRadius + inset, this.outerRadius - inset);
            const outerRadius = Math.max(this.innerRadius + inset, this.outerRadius - inset);
            const innerAngleOffset = innerRadius > inset ? inset / innerRadius : inset;
            const outerAngleOffset = outerRadius > inset ? inset / outerRadius : inset;

            const sweep = Math.abs(endAngle - startAngle);
            if (sweep < 2 * outerAngleOffset) return;

            const innerAngleExceeded = sweep < 2 * innerAngleOffset;

            path.moveTo(
                centerX + innerRadius * Math.cos(startAngle + innerAngleOffset),
                centerY + innerRadius * Math.sin(startAngle + innerAngleOffset)
            );
            path.arc(centerX, centerY, outerRadius, startAngle + outerAngleOffset, endAngle - outerAngleOffset);

            if (innerAngleExceeded) {
                // Draw a wedge on a cartesian co-ordinate with radius `sweep`
                // Inset from bottom - i.e. y = inset
                // Inset the top - i.e. y = x0 + x * tan(sweep)
                // Form a right angle from the wedge with hypotenuse x0 and an opposite side of inset
                // Gives x0 = inset * sin(sweep)
                // y = inset = inset * sin(sweep) + x * tan(sweep) - solve for x
                const x = inset / (Math.tan(sweep) / (1 - Math.sin(sweep)));
                // Floating point isn't perfect, so if we're getting an answer too small, use the innerRadius
                const r = Math.max(Math.hypot(inset, x), innerRadius);
                const midAngle = (startAngle + endAngle) / 2;
                path.lineTo(centerX + r * Math.cos(midAngle), centerY + r * Math.sin(midAngle));
            } else if (innerRadius > 0) {
                path.arc(
                    centerX,
                    centerY,
                    innerRadius,
                    endAngle - innerAngleOffset,
                    startAngle + innerAngleOffset,
                    true
                );
            } else {
                path.lineTo(centerX, centerY);
            }
        }

        path.closePath();

        this.dirtyPath = false;
    }

    override isPointInPath(x: number, y: number): boolean {
        const { angleOffset } = this;
        const startAngle = this.startAngle + angleOffset;
        const endAngle = this.endAngle + angleOffset;
        const innerRadius = Math.min(this.innerRadius, this.outerRadius);
        const outerRadius = Math.max(this.innerRadius, this.outerRadius);

        const point = this.transformPoint(x, y);

        return isPointInSector(point.x, point.y, { startAngle, endAngle, innerRadius, outerRadius });
    }
}
