import type { LinearScale } from '../../../scale/linearScale';
import type { ChartAxisDirection } from '../../chartAxisDirection';

/**
 * Domain calculation context
 */
export interface DomainContext {
    angleScale: LinearScale;
    radiusScale: LinearScale;
    properties: {
        radiusMin?: number;
        radiusMax?: number;
        domainPadding?: number;
        domainMargin?: number;
    };
}

/**
 * Series domain data interface
 */
export interface SeriesDomainData {
    angleValues: number[];
    radiusValues?: number[];
    angleFilterValues?: number[];
}

/**
 * Domain calculation result
 */
export interface DomainResult {
    angleDomain: [number, number];
    radiusDomain?: [number, number];
    hasValidData: boolean;
}

/**
 * Comprehensive domain calculation utilities for polar series
 */
export class PolarDomainCalculator {
    constructor(private readonly context: DomainContext) {}

    /**
     * Calculate series domain for specified direction
     */
    getSeriesDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.Angle) {
            return this.context.angleScale.domain;
        } else {
            return this.context.radiusScale.domain;
        }
    }

    /**
     * Calculate complete domain from series data
     */
    calculateDomain(data: SeriesDomainData): DomainResult {
        const angleDomain = this.calculateAngleDomain(data.angleValues);
        const radiusDomain = data.radiusValues ? this.calculateRadiusDomain(data.radiusValues) : undefined;

        return {
            angleDomain,
            radiusDomain,
            hasValidData: this.validateDomainData(data),
        };
    }

    /**
     * Calculate angle domain (typically [0, 1] for pie charts)
     */
    private calculateAngleDomain(angleValues: number[]): [number, number] {
        if (angleValues.length === 0) {
            return [0, 1];
        }

        // For pie charts, angle domain is typically normalized to [0, 1]
        // representing the full circle as proportions
        return [0, 1];
    }

    /**
     * Calculate radius domain with padding
     */
    private calculateRadiusDomain(radiusValues: number[]): [number, number] {
        if (radiusValues.length === 0) {
            return [0, 1];
        }

        const { radiusMin, radiusMax, domainPadding = 0 } = this.context.properties;

        let min = radiusMin ?? Math.min(...radiusValues);
        let max = radiusMax ?? Math.max(...radiusValues);

        // Apply domain padding
        if (domainPadding > 0) {
            const range = max - min;
            const padding = range * domainPadding;
            min = Math.max(0, min - padding); // Don't go below 0 for radius
            max = max + padding;
        }

        return [min, max];
    }

    /**
     * Validate domain data integrity
     */
    private validateDomainData(data: SeriesDomainData): boolean {
        return (
            data.angleValues.length > 0 &&
            data.angleValues.every((value) => typeof value === 'number' && isFinite(value))
        );
    }
}

/**
 * Domain padding utilities
 */
export class DomainPaddingUtils {
    /**
     * Apply symmetric padding to domain
     */
    static applySymmetricPadding(domain: [number, number], paddingRatio: number): [number, number] {
        const [min, max] = domain;
        const range = max - min;
        const padding = range * paddingRatio;

        return [min - padding, max + padding];
    }

    /**
     * Apply asymmetric padding to domain
     */
    static applyAsymmetricPadding(
        domain: [number, number],
        startPadding: number,
        endPadding: number
    ): [number, number] {
        const [min, max] = domain;
        return [min - startPadding, max + endPadding];
    }

    /**
     * Apply percentage-based padding
     */
    static applyPercentagePadding(
        domain: [number, number],
        startPercentage: number,
        endPercentage: number
    ): [number, number] {
        const [min, max] = domain;
        const range = max - min;

        return [min - (range * startPercentage) / 100, max + (range * endPercentage) / 100];
    }

    /**
     * Constrain domain to minimum and maximum bounds
     */
    static constrainDomain(domain: [number, number], minBound?: number, maxBound?: number): [number, number] {
        let [min, max] = domain;

        if (minBound !== undefined) {
            min = Math.max(min, minBound);
        }
        if (maxBound !== undefined) {
            max = Math.min(max, maxBound);
        }

        return [min, max];
    }
}

/**
 * Domain margin utilities for layout considerations
 */
export class DomainMarginUtils {
    /**
     * Calculate domain margins based on label requirements
     */
    static calculateLabelMargins(
        labelSizes: { width: number; height: number }[],
        containerSize: { width: number; height: number }
    ): { top: number; right: number; bottom: number; left: number } {
        if (labelSizes.length === 0) {
            return { top: 0, right: 0, bottom: 0, left: 0 };
        }

        const maxWidth = Math.max(...labelSizes.map((s) => s.width));
        const maxHeight = Math.max(...labelSizes.map((s) => s.height));

        return {
            top: maxHeight / 2,
            right: maxWidth / 2,
            bottom: maxHeight / 2,
            left: maxWidth / 2,
        };
    }

    /**
     * Apply margins to effective domain area
     */
    static applyMarginsToArea(
        totalArea: { width: number; height: number },
        margins: { top: number; right: number; bottom: number; left: number }
    ): { width: number; height: number; x: number; y: number } {
        return {
            x: margins.left,
            y: margins.top,
            width: totalArea.width - margins.left - margins.right,
            height: totalArea.height - margins.top - margins.bottom,
        };
    }
}

/**
 * Domain validation utilities
 */
export class DomainValidationUtils {
    /**
     * Validate domain bounds
     */
    static validateDomainBounds(domain: [number, number]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const [min, max] = domain;

        if (!isFinite(min) || !isFinite(max)) {
            errors.push('Domain bounds must be finite numbers');
        }

        if (min >= max) {
            errors.push('Domain minimum must be less than maximum');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate angle domain (specific to polar series)
     */
    static validateAngleDomain(domain: [number, number]): { isValid: boolean; errors: string[] } {
        const baseValidation = this.validateDomainBounds(domain);
        if (!baseValidation.isValid) {
            return baseValidation;
        }

        const errors: string[] = [];
        const [min, max] = domain;

        // For pie charts, angle domain should typically be [0, 1]
        if (min < 0) {
            errors.push('Angle domain minimum should not be negative for pie charts');
        }

        if (max > 1) {
            errors.push('Angle domain maximum should not exceed 1 for normalized pie charts');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate radius domain (specific to polar series)
     */
    static validateRadiusDomain(domain: [number, number]): { isValid: boolean; errors: string[] } {
        const baseValidation = this.validateDomainBounds(domain);
        if (!baseValidation.isValid) {
            return baseValidation;
        }

        const errors: string[] = [];
        const [min, max] = domain;

        if (min < 0) {
            errors.push('Radius domain minimum cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * Auto-domain calculation utilities
 */
export class AutoDomainCalculator {
    /**
     * Calculate optimal domain from data values
     */
    static calculateOptimalDomain(
        values: number[],
        options: {
            includeZero?: boolean;
            padding?: number;
            minSpan?: number;
            maxSpan?: number;
        } = {}
    ): [number, number] {
        if (values.length === 0) {
            return [0, 1];
        }

        const { includeZero = false, padding = 0.1, minSpan = 0, maxSpan = Infinity } = options;

        let min = Math.min(...values);
        let max = Math.max(...values);

        if (includeZero) {
            min = Math.min(min, 0);
            max = Math.max(max, 0);
        }

        // Ensure minimum span
        const currentSpan = max - min;
        if (currentSpan < minSpan) {
            const center = (min + max) / 2;
            const halfSpan = minSpan / 2;
            min = center - halfSpan;
            max = center + halfSpan;
        }

        // Limit maximum span
        if (currentSpan > maxSpan) {
            const center = (min + max) / 2;
            const halfSpan = maxSpan / 2;
            min = center - halfSpan;
            max = center + halfSpan;
        }

        // Apply padding
        if (padding > 0) {
            const range = max - min;
            const paddingAmount = range * padding;
            min -= paddingAmount;
            max += paddingAmount;
        }

        return [min, max];
    }

    /**
     * Calculate nice domain bounds (rounded to pleasant values)
     */
    static calculateNiceDomain(values: number[], targetTickCount: number = 5): [number, number] {
        if (values.length === 0) {
            return [0, 1];
        }

        const rawMin = Math.min(...values);
        const rawMax = Math.max(...values);
        const rawSpan = rawMax - rawMin;

        if (rawSpan === 0) {
            return [rawMin - 0.5, rawMax + 0.5];
        }

        // Calculate nice tick spacing
        const targetSpacing = rawSpan / (targetTickCount - 1);
        const magnitude = Math.pow(10, Math.floor(Math.log10(targetSpacing)));
        const normalizedSpacing = targetSpacing / magnitude;

        let niceSpacing: number;
        if (normalizedSpacing <= 1) {
            niceSpacing = 1;
        } else if (normalizedSpacing <= 2) {
            niceSpacing = 2;
        } else if (normalizedSpacing <= 5) {
            niceSpacing = 5;
        } else {
            niceSpacing = 10;
        }

        const actualSpacing = niceSpacing * magnitude;
        const niceMin = Math.floor(rawMin / actualSpacing) * actualSpacing;
        const niceMax = Math.ceil(rawMax / actualSpacing) * actualSpacing;

        return [niceMin, niceMax];
    }
}
