import { BBox } from '../bbox';
import { isPointInSector } from '../util/sector';
import { Path, ScenePathChangeDetection } from './path';

export class Sector extends Path {
    static override readonly className = 'Sector';

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
    concentricEdgeInset: number = 0;

    @ScenePathChangeDetection()
    radialEdgeInset: number = 0;

    @ScenePathChangeDetection()
    startOuterCornerRadius: number = 0;

    @ScenePathChangeDetection()
    endOuterCornerRadius: number = 0;

    @ScenePathChangeDetection()
    startInnerCornerRadius: number = 0;

    @ScenePathChangeDetection()
    endInnerCornerRadius: number = 0;

    set inset(value: number) {
        this.concentricEdgeInset = value;
        this.radialEdgeInset = value;
    }

    set cornerRadius(value: number) {
        this.startOuterCornerRadius = value;
        this.endOuterCornerRadius = value;
        this.startInnerCornerRadius = value;
        this.endInnerCornerRadius = value;
    }

    override computeBBox(): BBox {
        const radius = this.outerRadius;
        return new BBox(this.centerX - radius, this.centerY - radius, radius * 2, radius * 2);
    }

    override updatePath(): void {
        const path = this.path;

        const { angleOffset, concentricEdgeInset, radialEdgeInset } = this;
        let { startOuterCornerRadius, endOuterCornerRadius, startInnerCornerRadius, endInnerCornerRadius } = this;
        const startAngle = this.startAngle + angleOffset;
        const endAngle = this.endAngle + angleOffset;
        const sweep = startAngle <= endAngle ? endAngle - startAngle : Math.PI * 2 - (startAngle - endAngle);
        const innerRadius = Math.max(Math.min(this.innerRadius, this.outerRadius) + concentricEdgeInset, 0);
        const outerRadius = Math.max(Math.max(this.innerRadius, this.outerRadius) - concentricEdgeInset, 0);
        const fullPie = sweep >= 2 * Math.PI;
        const centerX = this.centerX;
        const centerY = this.centerY;

        path.clear();

        if (fullPie) {
            path.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            if (innerRadius > concentricEdgeInset) {
                path.moveTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
                path.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            }
            path.closePath();

            return;
        }

        const innerAngleOffset = innerRadius > 0 ? radialEdgeInset / innerRadius : 0;
        const outerAngleOffset = outerRadius > 0 ? radialEdgeInset / outerRadius : 0;

        const outerAngleExceeded = sweep < 2 * outerAngleOffset;
        if (outerAngleExceeded) return;

        const innerAngleExceeded = innerRadius <= concentricEdgeInset || sweep < 2 * innerAngleOffset;

        let radiusScale = 1;

        const outerEdgeLength = outerRadius * (endAngle - startAngle);
        let startOuterCornerRadiusAngleSweep = Math.asin(
            startOuterCornerRadius / (outerRadius - startOuterCornerRadius)
        );
        let endOuterCornerRadiusAngleSweep = Math.asin(startOuterCornerRadius / (outerRadius - startOuterCornerRadius));
        const outerRadiusLength =
            outerRadius * startOuterCornerRadiusAngleSweep + outerRadius * endOuterCornerRadiusAngleSweep;
        radiusScale = Math.max(outerRadiusLength / outerEdgeLength, radiusScale);

        const radialLength = outerRadius - innerRadius;
        const maxRadialRadiusLength = Math.max(
            startOuterCornerRadius + startInnerCornerRadius,
            endOuterCornerRadius + endInnerCornerRadius
        );
        radiusScale = Math.max(maxRadialRadiusLength / radialLength, radiusScale);

        let startInnerCornerRadiusAngleSweep = 0;
        let endInnerCornerRadiusAngleSweep = 0;

        if (!innerAngleExceeded && innerRadius > 0) {
            startInnerCornerRadiusAngleSweep = Math.asin(
                startInnerCornerRadius / (innerRadius + startInnerCornerRadius)
            );
            endInnerCornerRadiusAngleSweep = Math.asin(startInnerCornerRadius / (innerRadius + startInnerCornerRadius));
            const innerEdgeLength = innerRadius * (endAngle - innerAngleOffset - (startAngle + innerAngleOffset));
            const innerRadiusLength =
                innerRadius * startInnerCornerRadiusAngleSweep + innerRadius * endInnerCornerRadiusAngleSweep;
            radiusScale = Math.max(innerRadiusLength / innerEdgeLength, radiusScale);
        }

        if (radiusScale > 1) {
            startOuterCornerRadius /= radiusScale;
            endOuterCornerRadius /= radiusScale;
            startInnerCornerRadius /= radiusScale;
            endInnerCornerRadius /= radiusScale;

            startOuterCornerRadiusAngleSweep = Math.asin(
                startOuterCornerRadius / (outerRadius - startOuterCornerRadius)
            );
            endOuterCornerRadiusAngleSweep = Math.asin(startOuterCornerRadius / (outerRadius - startOuterCornerRadius));
            startInnerCornerRadiusAngleSweep = Math.asin(
                startInnerCornerRadius / (innerRadius + startInnerCornerRadius)
            );
            endInnerCornerRadiusAngleSweep = Math.asin(startInnerCornerRadius / (innerRadius + startInnerCornerRadius));
        }

        if (this.strokeWidth > 1) {
            console.log(radiusScale);
        }

        const startInnerRadiusAngleOffset = startInnerCornerRadius / (innerRadius + startInnerCornerRadius);
        const endInnerRadiusAngleOffset = endInnerCornerRadius / (innerRadius + endInnerCornerRadius);
        const startOuterRadiusAngleOffset = startOuterCornerRadius / (outerRadius - startOuterCornerRadius);
        const endOuterRadiusAngleOffset = endOuterCornerRadius / (outerRadius - endOuterCornerRadius);

        if (innerAngleExceeded) {
            // Draw a wedge on a cartesian co-ordinate with radius `sweep`
            // Inset from bottom - i.e. y = innerRadius
            // Inset the top - i.e. y = (x - x0) * tan(sweep)
            // Form a right angle from the wedge with hypotenuse x0 and an opposite side of innerRadius
            // Gives x0 = inset * sin(sweep)
            // y = inset = (x - inset * sin(sweep)) * tan(sweep) - solve for x
            // This formula has limits (i.e. sweep being >= a quarter turn),
            // but the bounds for x should be [innerRadius, outerRadius)
            const x = sweep < Math.PI * 0.5 ? (radialEdgeInset * (1 + Math.cos(sweep))) / Math.sin(sweep) : NaN;
            // r = sqrt(x**2 + y**2)
            let r: number;
            if (x > 0 && x < outerRadius) {
                // Even within the formula limits, floating point precision isn't always enough,
                // so ensure we never go less than the inner radius
                r = Math.max(Math.hypot(radialEdgeInset, x), innerRadius);
            } else {
                // Formula limits exceeded - just use the inner radius
                r = innerRadius;
            }
            const midAngle = startAngle + sweep * 0.5;
            path.moveTo(centerX + r * Math.cos(midAngle), centerY + r * Math.sin(midAngle));
        } else {
            path.moveTo(
                centerX + (innerRadius + startInnerCornerRadius) * Math.cos(startAngle + innerAngleOffset),
                centerY + (innerRadius + startInnerCornerRadius) * Math.sin(startAngle + innerAngleOffset)
            );
        }

        if (startOuterCornerRadius > 0) {
            const cx =
                centerX +
                (outerRadius - startOuterCornerRadius) *
                    Math.cos(startAngle + outerAngleOffset + startOuterRadiusAngleOffset);
            const cy =
                centerY +
                (outerRadius - startOuterCornerRadius) *
                    Math.sin(startAngle + outerAngleOffset + startOuterRadiusAngleOffset);
            path.arc(cx, cy, startOuterCornerRadius, startAngle - Math.PI * 0.5, startAngle);
        }

        path.arc(
            centerX,
            centerY,
            outerRadius,
            startAngle + outerAngleOffset + startOuterRadiusAngleOffset,
            endAngle - outerAngleOffset - endOuterRadiusAngleOffset
        );

        if (endOuterCornerRadius > 0) {
            const cx =
                centerX +
                (outerRadius - endOuterCornerRadius) *
                    Math.cos(endAngle - outerAngleOffset - endOuterRadiusAngleOffset);
            const cy =
                centerY +
                (outerRadius - endOuterCornerRadius) *
                    Math.sin(endAngle - outerAngleOffset - endOuterRadiusAngleOffset);
            path.arc(cx, cy, endOuterCornerRadius, endAngle, endAngle + Math.PI * 0.5);
        }

        if (innerAngleExceeded) {
            // Ignore - completed by closePath
        } else if (innerRadius > 0) {
            if (endInnerCornerRadius > 0) {
                const cx =
                    centerX +
                    (innerRadius + endInnerCornerRadius) *
                        Math.cos(endAngle - innerAngleOffset - endInnerRadiusAngleOffset);
                const cy =
                    centerY +
                    (innerRadius + endInnerCornerRadius) *
                        Math.sin(endAngle - innerAngleOffset - endInnerRadiusAngleOffset);
                path.arc(cx, cy, endInnerCornerRadius, endAngle + Math.PI * 0.5, endAngle + Math.PI);
            }

            path.arc(
                centerX,
                centerY,
                innerRadius,
                endAngle - innerAngleOffset - endInnerRadiusAngleOffset,
                startAngle + innerAngleOffset + startInnerRadiusAngleOffset,
                true
            );

            if (startInnerCornerRadius > 0) {
                const cx =
                    centerX +
                    (innerRadius + startInnerCornerRadius) *
                        Math.cos(startAngle + innerAngleOffset + startInnerRadiusAngleOffset);
                const cy =
                    centerY +
                    (innerRadius + startInnerCornerRadius) *
                        Math.sin(startAngle + innerAngleOffset + startInnerRadiusAngleOffset);
                path.arc(cx, cy, startInnerCornerRadius, startAngle + Math.PI, startAngle - Math.PI * 0.5);
            }
        } else {
            path.lineTo(centerX, centerY);
        }

        path.closePath();
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
