import { describe, expect, test } from '@jest/globals';

import { calculateBoxPlotDimensions, validateScaledValues } from './boxPlotRenderUtils';
import { validateBoxPlotData } from './statisticalUtils';

describe('BoxPlotSeriesHybrid utilities', () => {
    describe('validateBoxPlotData', () => {
        test('should validate correct box plot data', () => {
            const validData = { min: 1, q1: 2, median: 3, q3: 4, max: 5 };
            const result = validateBoxPlotData(validData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject invalid ordering', () => {
            const invalidData = { min: 5, q1: 2, median: 3, q3: 4, max: 1 };
            const result = validateBoxPlotData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should reject non-numeric values', () => {
            const invalidData = { min: NaN, q1: 2, median: 3, q3: 4, max: 5 };
            const result = validateBoxPlotData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('All statistical values must be finite numbers');
        });
    });

    describe('calculateBoxPlotDimensions', () => {
        test('should calculate dimensions for vertical box plot', () => {
            const scaledValues = {
                xValue: 100,
                minValue: 10,
                q1Value: 20,
                medianValue: 30,
                q3Value: 40,
                maxValue: 50,
            };
            const bandwidth = 20;
            const isVertical = true;

            const dimensions = calculateBoxPlotDimensions(scaledValues, bandwidth, isVertical);

            expect(dimensions.bandwidth).toBe(20);
            expect(dimensions.midPoint).toEqual({ x: 100, y: 30 });
            expect(dimensions.focusRect).toEqual({
                x: 90, // 100 - 20/2
                y: 10, // minValue
                width: 20,
                height: 40, // maxValue - minValue
            });
        });

        test('should calculate dimensions for horizontal box plot', () => {
            const scaledValues = {
                xValue: 100,
                minValue: 10,
                q1Value: 20,
                medianValue: 30,
                q3Value: 40,
                maxValue: 50,
            };
            const bandwidth = 20;
            const isVertical = false;

            const dimensions = calculateBoxPlotDimensions(scaledValues, bandwidth, isVertical);

            expect(dimensions.bandwidth).toBe(20);
            expect(dimensions.midPoint).toEqual({ x: 30, y: 100 });
            expect(dimensions.focusRect).toEqual({
                x: 10, // minValue
                y: 90, // 100 - 20/2
                width: 40, // maxValue - minValue
                height: 20,
            });
        });
    });

    describe('validateScaledValues', () => {
        test('should validate finite values', () => {
            const validValues = {
                xValue: 100,
                minValue: 10,
                q1Value: 20,
                medianValue: 30,
                q3Value: 40,
                maxValue: 50,
            };

            expect(validateScaledValues(validValues)).toBe(true);
        });

        test('should reject infinite values', () => {
            const invalidValues = {
                xValue: Infinity,
                minValue: 10,
                q1Value: 20,
                medianValue: 30,
                q3Value: 40,
                maxValue: 50,
            };

            expect(validateScaledValues(invalidValues)).toBe(false);
        });

        test('should reject NaN values', () => {
            const invalidValues = {
                xValue: 100,
                minValue: NaN,
                q1Value: 20,
                medianValue: 30,
                q3Value: 40,
                maxValue: 50,
            };

            expect(validateScaledValues(invalidValues)).toBe(false);
        });
    });
});
