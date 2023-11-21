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
            const innerAngleOffset = innerRadius > 0 ? inset / innerRadius : 0;
            const outerAngleOffset = outerRadius > 0 ? inset / outerRadius : 0;
            const sweep = Math.abs(endAngle - startAngle);

            const outerAngleExceeded = sweep < 2 * outerAngleOffset;
            if (outerAngleExceeded) return;

            const innerAngleExceeded = innerRadius <= inset || sweep < 2 * innerAngleOffset;

            if (innerAngleExceeded) {
                // Draw a wedge on a cartesian co-ordinate with radius `sweep`
                // Inset from bottom - i.e. y = innerRadius
                // Inset the top - i.e. y = x0 + x * tan(sweep)
                // Form a right angle from the wedge with hypotenuse x0 and an opposite side of innerRadius
                // Gives x0 = innerRadius * sin(sweep)
                // y = innerRadius = innerRadius * sin(sweep) + x * tan(sweep) - solve for x
                // This formula has limits (i.e. sweep being >= a quarter turn),
                // but the bounds for x should be [innerRadius, outerRadius)
                const x = Math.abs(sweep) < Math.PI * 0.5 ? (inset * (1 - Math.sin(sweep))) / Math.tan(sweep) : NaN;
                // r = sqrt(x**2 + y**2)
                let r: number;
                if (x > 0 && x < outerRadius) {
                    // Even within the formula limits, floating point precision isn't always enough,
                    // so ensure we never go less than the inner radius
                    r = Math.max(Math.hypot(inset, x), innerRadius);
                } else {
                    // Formula limits exceeded - just use the inner radius
                    r = innerRadius;
                }
                const midAngle = (startAngle + endAngle) / 2;
                path.moveTo(centerX + r * Math.cos(midAngle), centerY + r * Math.sin(midAngle));
            } else {
                path.moveTo(
                    centerX + innerRadius * Math.cos(startAngle + innerAngleOffset),
                    centerY + innerRadius * Math.sin(startAngle + innerAngleOffset)
                );
            }

            path.arc(centerX, centerY, outerRadius, startAngle + outerAngleOffset, endAngle - outerAngleOffset);

            if (innerAngleExceeded) {
                // Ignore - completed by closePath
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
