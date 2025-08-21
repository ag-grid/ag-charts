import type { Point } from 'ag-charts-core';

import type { Scale } from '../../../scale/scale';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import type { CartesianSeriesDataContext } from './interfaces';

/**
 * Node data creation utilities for Cartesian series
 */

export interface CartesianNodeDataConfig {
    xKey: string;
    yKey: string;
    xName?: string;
    yName?: string;
    legendItemName?: string;
    label?: {
        enabled: boolean;
    };
    marker?: {
        enabled: boolean;
        size: number;
    };
}

export interface CartesianNodeDatum {
    series: any;
    datum: any;
    datumIndex: number;
    xKey: string;
    yKey: string;
    xValue: any;
    yValue: any;
    point: Point & { size?: number };
    midPoint?: Point;
    cumulativeValue?: number;
    labelText?: string;
    selected?: boolean;
}

/**
 * Cartesian node data creation manager
 */
export class CartesianNodeDataManager {
    /**
     * Create node data for Cartesian series
     */
    static createNodeData<TDatum extends CartesianNodeDatum>(
        context: CartesianSeriesDataContext,
        config: CartesianNodeDataConfig
    ): TDatum[] {
        const { dataModel, processedData, axes } = context;
        if (!dataModel || !processedData) return [];

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        if (!xAxis || !yAxis) return [];

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;

        return this.processDataRows(context, dataModel, processedData, config, {
            xScale,
            yScale,
            xOffset,
            yOffset,
        });
    }

    /**
     * Process individual data rows into node data
     */
    private static processDataRows<TDatum extends CartesianNodeDatum>(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        config: CartesianNodeDataConfig,
        scales: {
            xScale: Scale<any, number, any>;
            yScale: Scale<any, number, any>;
            xOffset: number;
            yOffset: number;
        }
    ): TDatum[] {
        const nodeData: TDatum[] = [];
        const rawData = processedData.dataSources.get(context.id) ?? [];

        const xValues = dataModel.resolveColumnById(context, 'xValue', processedData);
        const yValues = dataModel.resolveColumnById(context, 'yValueRaw', processedData);
        const yCumulativeValues = dataModel.resolveColumnById(context, 'yValue', processedData);

        const { xScale, yScale, xOffset, yOffset } = scales;

        for (let i = 0; i < rawData.length; i++) {
            const datum = rawData[i];
            const xDatum = xValues[i];
            const yDatum = yValues[i];
            const yCumulative = yCumulativeValues?.[i] ?? yDatum;

            if (xDatum == null) continue;

            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yCumulative) + yOffset;

            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

            const size = config.marker?.enabled ? config.marker.size : 0;

            const labelText = config.label?.enabled ? this.createLabelText(yDatum, datum, config) : undefined;

            const nodeDatum: CartesianNodeDatum = {
                series: context,
                datum,
                datumIndex: i,
                xKey: config.xKey,
                yKey: config.yKey,
                xValue: xDatum,
                yValue: yDatum,
                point: { x, y, size },
                midPoint: { x, y },
                cumulativeValue: yCumulative,
                labelText,
                selected: false,
            };

            nodeData.push(nodeDatum as TDatum);
        }

        return nodeData;
    }

    /**
     * Create label text for node
     */
    private static createLabelText(value: any, datum: any, config: CartesianNodeDataConfig): string | undefined {
        if (value == null) return undefined;

        // Basic label text - could be enhanced with formatters
        return String(value);
    }

    /**
     * Calculate scale offsets for positioning
     */
    static calculateScaleOffsets(
        xScale: Scale<any, number, any>,
        yScale: Scale<any, number, any>
    ): { xOffset: number; yOffset: number } {
        return {
            xOffset: (xScale.bandwidth ?? 0) / 2,
            yOffset: (yScale.bandwidth ?? 0) / 2,
        };
    }

    /**
     * Convert data value to screen coordinates
     */
    static valueToCoordinate(value: any, scale: Scale<any, number, any>, offset: number = 0): number {
        return scale.convert(value) + offset;
    }

    /**
     * Batch convert multiple values to coordinates
     */
    static valuesToCoordinates(values: any[], scale: Scale<any, number, any>, offset: number = 0): number[] {
        return values.map((value) => this.valueToCoordinate(value, scale, offset));
    }

    /**
     * Filter visible node data based on axis ranges
     */
    static filterVisibleNodeData<TDatum extends CartesianNodeDatum>(
        nodeData: TDatum[],
        xRange: [number, number],
        yRange?: [number, number]
    ): TDatum[] {
        return nodeData.filter((datum) => {
            const { point } = datum;
            if (!point) return false;

            const xVisible = point.x >= xRange[0] && point.x <= xRange[1];

            if (yRange) {
                const yVisible = point.y >= yRange[0] && point.y <= yRange[1];
                return xVisible && yVisible;
            }

            return xVisible;
        });
    }

    /**
     * Calculate bounds for node data
     */
    static calculateNodeDataBounds<TDatum extends CartesianNodeDatum>(
        nodeData: TDatum[]
    ): { x: [number, number]; y: [number, number] } | null {
        if (nodeData.length === 0) return null;

        let xMin = Infinity,
            xMax = -Infinity;
        let yMin = Infinity,
            yMax = -Infinity;

        for (const datum of nodeData) {
            if (!datum.point) continue;

            xMin = Math.min(xMin, datum.point.x);
            xMax = Math.max(xMax, datum.point.x);
            yMin = Math.min(yMin, datum.point.y);
            yMax = Math.max(yMax, datum.point.y);
        }

        if (xMin === Infinity) return null;

        return {
            x: [xMin, xMax],
            y: [yMin, yMax],
        };
    }

    /**
     * Group node data by x value for stacking
     */
    static groupNodeDataByX<TDatum extends CartesianNodeDatum>(nodeData: TDatum[]): Map<any, TDatum[]> {
        const groups = new Map<any, TDatum[]>();

        for (const datum of nodeData) {
            const xValue = datum.xValue;
            if (!groups.has(xValue)) {
                groups.set(xValue, []);
            }
            groups.get(xValue)!.push(datum);
        }

        return groups;
    }
}

/**
 * Coordinate calculation utilities
 */
export class CartesianCoordinateUtils {
    /**
     * Calculate point coordinates from data values
     */
    static calculatePoint(
        xValue: any,
        yValue: any,
        xScale: Scale<any, number, any>,
        yScale: Scale<any, number, any>,
        offsets: { x: number; y: number } = { x: 0, y: 0 }
    ): Point | null {
        if (xValue == null || yValue == null) return null;

        const x = xScale.convert(xValue) + offsets.x;
        const y = yScale.convert(yValue) + offsets.y;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        return { x, y };
    }

    /**
     * Calculate multiple points from arrays
     */
    static calculatePoints(
        xValues: any[],
        yValues: any[],
        xScale: Scale<any, number, any>,
        yScale: Scale<any, number, any>,
        offsets: { x: number; y: number } = { x: 0, y: 0 }
    ): (Point | null)[] {
        const length = Math.min(xValues.length, yValues.length);
        const points: (Point | null)[] = [];

        for (let i = 0; i < length; i++) {
            points.push(this.calculatePoint(xValues[i], yValues[i], xScale, yScale, offsets));
        }

        return points;
    }

    /**
     * Convert screen coordinates back to data values
     */
    static coordinateToValue(coordinate: number, scale: Scale<any, number, any>, offset: number = 0): any {
        return scale.invert(coordinate - offset);
    }

    /**
     * Check if coordinate is within scale range
     */
    static isCoordinateInRange(coordinate: number, scale: Scale<any, number, any>): boolean {
        const [min, max] = scale.range;
        return coordinate >= Math.min(min, max) && coordinate <= Math.max(min, max);
    }

    /**
     * Clamp coordinate to scale range
     */
    static clampCoordinateToRange(coordinate: number, scale: Scale<any, number, any>): number {
        const [min, max] = scale.range;
        const rangeMin = Math.min(min, max);
        const rangeMax = Math.max(min, max);

        return Math.max(rangeMin, Math.min(rangeMax, coordinate));
    }
}
