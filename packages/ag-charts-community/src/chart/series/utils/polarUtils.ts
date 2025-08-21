import type { LinearScale } from '../../../scale/linearScale';
import { modulus, normalizeAngle180, toRadians } from '../../../util/angle';
import type { ChartAxisDirection } from '../../chartAxisDirection';

/**
 * Polar coordinate calculation utilities
 */
export class PolarCoordinateUtils {
    /**
     * Calculate polar angle for given position
     */
    static calculateAngle(x: number, y: number): number {
        return Math.atan2(y, x);
    }

    /**
     * Calculate distance from origin
     */
    static calculateRadius(x: number, y: number): number {
        return Math.sqrt(x * x + y * y);
    }

    /**
     * Convert polar coordinates to cartesian
     */
    static polarToCartesian(
        angle: number,
        radius: number,
        centerX: number = 0,
        centerY: number = 0
    ): { x: number; y: number } {
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        };
    }

    /**
     * Convert cartesian coordinates to polar
     */
    static cartesianToPolar(
        x: number,
        y: number,
        centerX: number = 0,
        centerY: number = 0
    ): { angle: number; radius: number } {
        const deltaX = x - centerX;
        const deltaY = y - centerY;
        return {
            angle: this.calculateAngle(deltaX, deltaY),
            radius: this.calculateRadius(deltaX, deltaY),
        };
    }
}

/**
 * Sector rendering utilities
 */
export class SectorUtils {
    /**
     * Calculate sector span angle
     */
    static calculateSpan(startAngle: number, endAngle: number): number {
        return Math.abs(endAngle - startAngle);
    }

    /**
     * Calculate sector mid-angle
     */
    static calculateMidAngle(startAngle: number, endAngle: number): number {
        const span = this.calculateSpan(startAngle, endAngle);
        return startAngle + span / 2;
    }

    /**
     * Calculate sector mid-point coordinates
     */
    static calculateMidPoint(
        startAngle: number,
        endAngle: number,
        innerRadius: number,
        outerRadius: number
    ): { x: number; y: number; midAngle: number; midRadius: number } {
        const midAngle = this.calculateMidAngle(startAngle, endAngle);
        const midRadius = innerRadius + (outerRadius - innerRadius) / 2;

        return {
            x: Math.cos(midAngle) * midRadius,
            y: Math.sin(midAngle) * midRadius,
            midAngle,
            midRadius,
        };
    }

    /**
     * Check if angle is within sector bounds
     */
    static isAngleInSector(angle: number, startAngle: number, endAngle: number): boolean {
        // Normalize angles to [0, 2π]
        const normalizeAngle = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        const normalizedAngle = normalizeAngle(angle);
        const normalizedStart = normalizeAngle(startAngle);
        const normalizedEnd = normalizeAngle(endAngle);

        if (normalizedStart <= normalizedEnd) {
            return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
        } else {
            // Sector crosses 0 degrees
            return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
        }
    }

    /**
     * Calculate sector area
     */
    static calculateArea(startAngle: number, endAngle: number, innerRadius: number, outerRadius: number): number {
        const span = this.calculateSpan(startAngle, endAngle);
        const outerArea = 0.5 * outerRadius * outerRadius * span;
        const innerArea = 0.5 * innerRadius * innerRadius * span;
        return outerArea - innerArea;
    }
}

/**
 * Angle calculation utilities for polar series
 */
export class AngleCalculationUtils {
    /**
     * Process angle calculations with rotation
     */
    static processAngles(
        angleScale: LinearScale,
        currentStart: number,
        currentValue: number,
        rotation: number
    ): {
        startAngle: number;
        endAngle: number;
        midAngle: number;
        span: number;
        midCos: number;
        midSin: number;
    } {
        const startAngle = angleScale.convert(currentStart) + toRadians(rotation);
        const endAngle = angleScale.convert(currentStart + currentValue) + toRadians(rotation);
        const span = Math.abs(endAngle - startAngle);
        const midAngle = startAngle + span / 2;

        return {
            startAngle,
            endAngle,
            midAngle,
            span,
            midCos: Math.cos(midAngle),
            midSin: Math.sin(midAngle),
        };
    }

    /**
     * Normalize angle to specific range
     */
    static normalizeAngleToRange(angle: number, minAngle: number = 0, maxAngle: number = 2 * Math.PI): number {
        const range = maxAngle - minAngle;
        let normalized = ((((angle - minAngle) % range) + range) % range) + minAngle;
        return normalized;
    }

    /**
     * Calculate angle difference
     */
    static angleDifference(angle1: number, angle2: number): number {
        const diff = angle2 - angle1;
        return ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
    }
}

/**
 * Radius calculation utilities
 */
export class RadiusCalculationUtils {
    /**
     * Calculate inner radius based on ratio and offset
     */
    static calculateInnerRadius(
        outerRadius: number,
        innerRadiusRatio: number = 1,
        innerRadiusOffset: number = 0
    ): number {
        const innerRadius = outerRadius * innerRadiusRatio + innerRadiusOffset;
        if (innerRadius === outerRadius || innerRadius < 0) {
            return 0;
        }
        return innerRadius;
    }

    /**
     * Calculate outer radius based on ratio and offset
     */
    static calculateOuterRadius(
        baseRadius: number,
        outerRadiusRatio: number = 1,
        outerRadiusOffset: number = 0
    ): number {
        return Math.max(baseRadius * outerRadiusRatio + outerRadiusOffset, 0);
    }

    /**
     * Validate radius values
     */
    static validateRadii(innerRadius: number, outerRadius: number): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (innerRadius < 0) {
            errors.push('Inner radius cannot be negative');
        }
        if (outerRadius < 0) {
            errors.push('Outer radius cannot be negative');
        }
        if (innerRadius > outerRadius) {
            errors.push('Inner radius cannot be greater than outer radius');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * Text alignment utilities for polar labels
 */
export class PolarTextAlignmentUtils {
    /**
     * Calculate text alignment based on angle position
     */
    static getTextAlignment(midAngle: number): {
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    } {
        const quadrantTextOpts: Array<{
            textAlign: CanvasTextAlign;
            textBaseline: CanvasTextBaseline;
        }> = [
            { textAlign: 'center', textBaseline: 'bottom' },
            { textAlign: 'left', textBaseline: 'middle' },
            { textAlign: 'center', textBaseline: 'top' },
            { textAlign: 'right', textBaseline: 'middle' },
        ];

        const midAngle180 = normalizeAngle180(midAngle);

        // Split the circle into quadrants like so: ⊗
        const quadrantStart = -0.75 * Math.PI; // same as `normalizeAngle180(toRadians(-135))`
        const quadrantOffset = midAngle180 - quadrantStart;
        const quadrant = Math.floor(quadrantOffset / (Math.PI / 2));
        const quadrantIndex = modulus(quadrant, quadrantTextOpts.length);

        return quadrantTextOpts[quadrantIndex];
    }

    /**
     * Calculate label position based on angle and radius
     */
    static calculateLabelPosition(midAngle: number, radius: number, offset: number = 0): { x: number; y: number } {
        const labelRadius = radius + offset;
        return {
            x: Math.cos(midAngle) * labelRadius,
            y: Math.sin(midAngle) * labelRadius,
        };
    }
}

/**
 * Domain calculation utilities for polar series
 */
export class PolarDomainUtils {
    /**
     * Get series domain for specified direction
     */
    static getSeriesDomain(direction: ChartAxisDirection, angleScale: LinearScale, radiusScale: LinearScale): any[] {
        if (direction === ChartAxisDirection.Angle) {
            return angleScale.domain;
        } else {
            return radiusScale.domain;
        }
    }

    /**
     * Calculate domain padding for polar series
     */
    static calculateDomainPadding(values: number[], paddingRatio: number = 0.1): { min: number; max: number } {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const padding = range * paddingRatio;

        return {
            min: min - padding,
            max: max + padding,
        };
    }
}

/**
 * Scale management utilities for polar series
 */
export class PolarScaleManager {
    /**
     * Initialize angle scale with standard polar settings
     */
    static initializeAngleScale(): LinearScale {
        const angleScale = new LinearScale();
        angleScale.domain = [0, 1];
        // Add 90 deg to start the first pie at 12 o'clock.
        angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);
        return angleScale;
    }

    /**
     * Initialize radius scale
     */
    static initializeRadiusScale(innerRadius: number = 0, outerRadius: number = 1): LinearScale {
        const radiusScale = new LinearScale();
        radiusScale.domain = [0, 1];
        radiusScale.range = [innerRadius, outerRadius];
        return radiusScale;
    }

    /**
     * Update radius scale range
     */
    static updateRadiusScaleRange(radiusScale: LinearScale, innerRadius: number, outerRadius: number): void {
        radiusScale.range = [innerRadius, outerRadius];
    }

    /**
     * Copy scale settings
     */
    static copyScale(sourceScale: LinearScale, targetScale: LinearScale): void {
        targetScale.domain = [...sourceScale.domain];
        targetScale.range = [...sourceScale.range];
    }
}

/**
 * Polar geometry utilities
 */
export class PolarGeometryUtils {
    /**
     * Calculate bounding box for polar shape
     */
    static calculatePolarBBox(
        startAngle: number,
        endAngle: number,
        innerRadius: number,
        outerRadius: number,
        centerX: number = 0,
        centerY: number = 0
    ): { x: number; y: number; width: number; height: number } {
        // For simplicity, return a circular bounding box
        // A more precise implementation would calculate the actual sector bounds
        return {
            x: centerX - outerRadius,
            y: centerY - outerRadius,
            width: outerRadius * 2,
            height: outerRadius * 2,
        };
    }

    /**
     * Check if point is within polar sector
     */
    static isPointInPolarSector(
        x: number,
        y: number,
        startAngle: number,
        endAngle: number,
        innerRadius: number,
        outerRadius: number,
        centerX: number = 0,
        centerY: number = 0
    ): boolean {
        const polar = PolarCoordinateUtils.cartesianToPolar(x, y, centerX, centerY);

        // Check radius bounds
        if (polar.radius < innerRadius || polar.radius > outerRadius) {
            return false;
        }

        // Check angle bounds
        return SectorUtils.isAngleInSector(polar.angle, startAngle, endAngle);
    }
}
