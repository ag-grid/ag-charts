/**
 * Rendering utilities for Box Plot series - geometric calculations and layout functions.
 * These utilities handle the visual layout aspects of box plot rendering.
 */

export interface ScaledBoxPlotValues {
    readonly xValue: number;
    readonly minValue: number;
    readonly q1Value: number;
    readonly medianValue: number;
    readonly q3Value: number;
    readonly maxValue: number;
}

export interface BoxPlotDimensions {
    readonly bandwidth: number;
    readonly midPoint: { x: number; y: number };
    readonly focusRect: { x: number; y: number; width: number; height: number };
}

/**
 * Calculates the middle point of a box plot for both vertical and horizontal orientations
 */
export function calculateMidPoint(scaledValues: ScaledBoxPlotValues, isVertical: boolean): { x: number; y: number } {
    const height = Math.abs(scaledValues.q3Value - scaledValues.q1Value);
    const midX = scaledValues.xValue;
    const midY = Math.min(scaledValues.q3Value, scaledValues.q1Value) + height / 2;

    return {
        x: isVertical ? midX : midY,
        y: isVertical ? midY : midX,
    };
}

/**
 * Calculates the focus rectangle for box plot interaction
 * This is the area that responds to mouse events
 */
export function calculateFocusRect(
    scaledValues: ScaledBoxPlotValues,
    bandwidth: number,
    isVertical: boolean
): { x: number; y: number; width: number; height: number } {
    const midPoint = calculateMidPoint(scaledValues, isVertical);

    if (isVertical) {
        return {
            x: midPoint.x - bandwidth / 2,
            y: scaledValues.minValue,
            width: bandwidth,
            height: scaledValues.maxValue - scaledValues.minValue,
        };
    } else {
        return {
            x: scaledValues.minValue,
            y: midPoint.y - bandwidth / 2,
            width: scaledValues.maxValue - scaledValues.minValue,
            height: bandwidth,
        };
    }
}

/**
 * Calculates complete box plot dimensions including midpoint and focus rectangle
 */
export function calculateBoxPlotDimensions(
    scaledValues: ScaledBoxPlotValues,
    bandwidth: number,
    isVertical: boolean
): BoxPlotDimensions {
    return {
        bandwidth,
        midPoint: calculateMidPoint(scaledValues, isVertical),
        focusRect: calculateFocusRect(scaledValues, bandwidth, isVertical),
    };
}

/**
 * Applies scaling and positioning offsets to the x-coordinate
 * Handles both continuous and categorical scales
 */
export function applyPositionOffset(
    baseXValue: number,
    groupScaleOffset: number,
    barOffset: number,
    bandwidth: number
): number {
    return baseXValue + groupScaleOffset + barOffset + bandwidth / 2;
}

/**
 * Validates that scaled values are finite numbers for rendering
 */
export function validateScaledValues(scaledValues: ScaledBoxPlotValues): boolean {
    const values = [
        scaledValues.xValue,
        scaledValues.minValue,
        scaledValues.q1Value,
        scaledValues.medianValue,
        scaledValues.q3Value,
        scaledValues.maxValue,
    ];

    return values.every((value) => Number.isFinite(value));
}

/**
 * Calculates the height of the box (IQR) in scaled coordinates
 */
export function calculateBoxHeight(scaledValues: Pick<ScaledBoxPlotValues, 'q1Value' | 'q3Value'>): number {
    return Math.abs(scaledValues.q3Value - scaledValues.q1Value);
}

/**
 * Calculates the total range of the box plot in scaled coordinates
 */
export function calculateTotalRange(scaledValues: Pick<ScaledBoxPlotValues, 'minValue' | 'maxValue'>): number {
    return Math.abs(scaledValues.maxValue - scaledValues.minValue);
}
