import type { Point } from 'ag-charts-core';

import { Path2D } from '../../../scene/path2D';
import type { SegmentedPath } from '../../../scene/shape/segmentedPath';

/**
 * Point with additional data for path building
 */
export interface PathPoint extends Point {
    xDatum?: any;
    yDatum?: any;
    missing?: boolean;
    break?: boolean;
}

/**
 * Path span representing a continuous segment of the path
 */
export interface PathSpan {
    points: PathPoint[];
    closed?: boolean;
    type?: 'line' | 'area' | 'curve';
}

/**
 * Interpolation types for path building
 */
export type InterpolationType = 'linear' | 'smooth' | 'step' | 'stepAfter' | 'stepBefore';

/**
 * Path building configuration
 */
export interface PathConfig {
    interpolation: InterpolationType;
    connectMissingData?: boolean;
    tension?: number; // For smooth interpolation
    strokeWidth?: number;
    lineDash?: number[];
}

/**
 * Path segment information
 */
export interface PathSegment {
    path: Path2D;
    bounds: { x: [number, number]; y: [number, number] };
    visible: boolean;
}

/**
 * Core path building utilities for Cartesian series
 */
export class CartesianPathBuilder {
    /**
     * Build path from points with interpolation
     */
    static buildPath(points: PathPoint[], config: PathConfig): Path2D {
        const path = new Path2D();

        if (points.length === 0) return path;

        switch (config.interpolation) {
            case 'linear':
                return this.buildLinearPath(points, path, config);
            case 'smooth':
                return this.buildSmoothPath(points, path, config);
            case 'step':
            case 'stepAfter':
            case 'stepBefore':
                return this.buildStepPath(points, path, config);
            default:
                return this.buildLinearPath(points, path, config);
        }
    }

    /**
     * Build linear interpolated path
     */
    private static buildLinearPath(points: PathPoint[], path: Path2D, config: PathConfig): Path2D {
        let moveToNext = true;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            if (point.missing && !config.connectMissingData) {
                moveToNext = true;
                continue;
            }

            if (point.break) {
                moveToNext = true;
                continue;
            }

            if (moveToNext) {
                path.moveTo(point.x, point.y);
                moveToNext = false;
            } else {
                path.lineTo(point.x, point.y);
            }
        }

        return path;
    }

    /**
     * Build smooth (Bezier) interpolated path
     */
    private static buildSmoothPath(points: PathPoint[], path: Path2D, config: PathConfig): Path2D {
        if (points.length < 2) return path;

        const tension = config.tension ?? 0.3;
        let moveToNext = true;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            if (point.missing && !config.connectMissingData) {
                moveToNext = true;
                continue;
            }

            if (point.break) {
                moveToNext = true;
                continue;
            }

            if (moveToNext) {
                path.moveTo(point.x, point.y);
                moveToNext = false;
                continue;
            }

            if (i === 1) {
                // First curve segment
                const prev = points[i - 1];
                const next = points[i + 1];
                const cp1x = prev.x + (point.x - prev.x) * tension;
                const cp1y = prev.y;
                const cp2x = point.x - (next ? (next.x - prev.x) * tension : 0);
                const cp2y = point.y;

                path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
            } else if (i === points.length - 1) {
                // Last segment - simple curve
                const prev = points[i - 1];
                const cp1x = prev.x + (point.x - prev.x) * tension;
                const cp1y = prev.y;

                path.quadraticCurveTo(cp1x, cp1y, point.x, point.y);
            } else {
                // Middle segments
                const prev = points[i - 1];
                const next = points[i + 1];
                const cp1x = prev.x + (point.x - prev.x) * tension;
                const cp1y = prev.y + (point.y - prev.y) * tension;
                const cp2x = point.x - (next.x - prev.x) * tension;
                const cp2y = point.y - (next.y - prev.y) * tension;

                path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
            }
        }

        return path;
    }

    /**
     * Build step interpolated path
     */
    private static buildStepPath(points: PathPoint[], path: Path2D, config: PathConfig): Path2D {
        let moveToNext = true;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            if (point.missing && !config.connectMissingData) {
                moveToNext = true;
                continue;
            }

            if (point.break) {
                moveToNext = true;
                continue;
            }

            if (moveToNext) {
                path.moveTo(point.x, point.y);
                moveToNext = false;
                continue;
            }

            const prevPoint = points[i - 1];

            switch (config.interpolation) {
                case 'step':
                    // Step in middle
                    const midX = (prevPoint.x + point.x) / 2;
                    path.lineTo(midX, prevPoint.y);
                    path.lineTo(midX, point.y);
                    path.lineTo(point.x, point.y);
                    break;

                case 'stepAfter':
                    // Step after
                    path.lineTo(point.x, prevPoint.y);
                    path.lineTo(point.x, point.y);
                    break;

                case 'stepBefore':
                    // Step before
                    path.lineTo(prevPoint.x, point.y);
                    path.lineTo(point.x, point.y);
                    break;
            }
        }

        return path;
    }

    /**
     * Build area path (includes both stroke and fill paths)
     */
    static buildAreaPath(
        topPoints: PathPoint[],
        bottomPoints: PathPoint[],
        config: PathConfig
    ): { strokePath: Path2D; fillPath: Path2D } {
        const strokePath = this.buildPath(topPoints, config);
        const fillPath = new Path2D(strokePath);

        // Add bottom path in reverse for area fill
        if (bottomPoints.length > 0) {
            const reversedBottom = [...bottomPoints].reverse();
            if (reversedBottom.length > 0) {
                fillPath.lineTo(reversedBottom[0].x, reversedBottom[0].y);
                for (let i = 1; i < reversedBottom.length; i++) {
                    fillPath.lineTo(reversedBottom[i].x, reversedBottom[i].y);
                }
                fillPath.closePath();
            }
        }

        return { strokePath, fillPath };
    }
}

/**
 * Path segmentation utilities for clipping and performance
 */
export class CartesianPathSegmenter {
    /**
     * Segment path based on viewport bounds
     */
    static segmentPath(
        points: PathPoint[],
        viewportBounds: { x: [number, number]; y: [number, number] },
        config: PathConfig
    ): PathSegment[] {
        const segments: PathSegment[] = [];
        const [xMin, xMax] = viewportBounds.x;
        const [yMin, yMax] = viewportBounds.y;

        let currentSegment: PathPoint[] = [];
        let segmentBounds = {
            x: [Infinity, -Infinity] as [number, number],
            y: [Infinity, -Infinity] as [number, number],
        };

        const flushSegment = () => {
            if (currentSegment.length > 0) {
                const path = CartesianPathBuilder.buildPath(currentSegment, config);
                const visible = this.isSegmentVisible(segmentBounds, viewportBounds);

                segments.push({
                    path,
                    bounds: segmentBounds,
                    visible,
                });

                currentSegment = [];
                segmentBounds = {
                    x: [Infinity, -Infinity],
                    y: [Infinity, -Infinity],
                };
            }
        };

        for (const point of points) {
            if (point.break) {
                flushSegment();
                continue;
            }

            currentSegment.push(point);

            // Update segment bounds
            segmentBounds.x[0] = Math.min(segmentBounds.x[0], point.x);
            segmentBounds.x[1] = Math.max(segmentBounds.x[1], point.x);
            segmentBounds.y[0] = Math.min(segmentBounds.y[0], point.y);
            segmentBounds.y[1] = Math.max(segmentBounds.y[1], point.y);

            // Check if we should create a new segment (e.g., every N points or when crossing viewport)
            if (currentSegment.length >= 1000 || (point.x > xMax && currentSegment.length > 1)) {
                flushSegment();
            }
        }

        flushSegment();
        return segments;
    }

    /**
     * Check if segment is visible in viewport
     */
    private static isSegmentVisible(
        segmentBounds: { x: [number, number]; y: [number, number] },
        viewportBounds: { x: [number, number]; y: [number, number] }
    ): boolean {
        const [sxMin, sxMax] = segmentBounds.x;
        const [syMin, syMax] = segmentBounds.y;
        const [vxMin, vxMax] = viewportBounds.x;
        const [vyMin, vyMax] = viewportBounds.y;

        // Check for overlap
        return !(sxMax < vxMin || sxMin > vxMax || syMax < vyMin || syMin > vyMax);
    }
}

/**
 * Path animation utilities
 */
export class CartesianPathAnimationUtils {
    /**
     * Create path morph animation between two paths
     */
    static createPathMorphAnimation(fromPath: Path2D, toPath: Path2D, duration: number = 300): (t: number) => Path2D {
        const fromCommands = this.getPathCommands(fromPath);
        const toCommands = this.getPathCommands(toPath);

        // Normalize command arrays to same length
        const { from, to } = this.normalizePathCommands(fromCommands, toCommands);

        return (t: number) => {
            const interpolatedPath = new Path2D();

            for (let i = 0; i < from.length; i++) {
                const fromCmd = from[i];
                const toCmd = to[i];

                if (fromCmd.type !== toCmd.type) continue;

                const interpolatedArgs = fromCmd.args.map((fromArg, argIndex) => {
                    const toArg = toCmd.args[argIndex] || fromArg;
                    return fromArg + (toArg - fromArg) * t;
                });

                switch (fromCmd.type) {
                    case 'moveTo':
                        interpolatedPath.moveTo(interpolatedArgs[0], interpolatedArgs[1]);
                        break;
                    case 'lineTo':
                        interpolatedPath.lineTo(interpolatedArgs[0], interpolatedArgs[1]);
                        break;
                    case 'bezierCurveTo':
                        interpolatedPath.bezierCurveTo(
                            interpolatedArgs[0],
                            interpolatedArgs[1],
                            interpolatedArgs[2],
                            interpolatedArgs[3],
                            interpolatedArgs[4],
                            interpolatedArgs[5]
                        );
                        break;
                    case 'quadraticCurveTo':
                        interpolatedPath.quadraticCurveTo(
                            interpolatedArgs[0],
                            interpolatedArgs[1],
                            interpolatedArgs[2],
                            interpolatedArgs[3]
                        );
                        break;
                }
            }

            return interpolatedPath;
        };
    }

    /**
     * Extract path commands for animation
     */
    private static getPathCommands(path: Path2D): Array<{ type: string; args: number[] }> {
        // This would need to be implemented based on Path2D's internal structure
        // For now, return empty array as placeholder
        return [];
    }

    /**
     * Normalize path commands for morphing animation
     */
    private static normalizePathCommands(
        from: Array<{ type: string; args: number[] }>,
        to: Array<{ type: string; args: number[] }>
    ): {
        from: Array<{ type: string; args: number[] }>;
        to: Array<{ type: string; args: number[] }>;
    } {
        // Ensure both command arrays have the same length
        const maxLength = Math.max(from.length, to.length);
        const normalizedFrom = [...from];
        const normalizedTo = [...to];

        // Pad shorter array with the last command
        while (normalizedFrom.length < maxLength) {
            const last = normalizedFrom[normalizedFrom.length - 1];
            normalizedFrom.push(last ? { ...last } : { type: 'lineTo', args: [0, 0] });
        }

        while (normalizedTo.length < maxLength) {
            const last = normalizedTo[normalizedTo.length - 1];
            normalizedTo.push(last ? { ...last } : { type: 'lineTo', args: [0, 0] });
        }

        return { from: normalizedFrom, to: normalizedTo };
    }
}

/**
 * Path optimization utilities
 */
export class CartesianPathOptimizer {
    /**
     * Simplify path by removing redundant points
     */
    static simplifyPath(points: PathPoint[], tolerance: number = 1): PathPoint[] {
        if (points.length <= 2) return points;

        const simplified: PathPoint[] = [points[0]];

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const current = points[i];
            const next = points[i + 1];

            // Calculate perpendicular distance from current point to line between prev and next
            const distance = this.perpendicularDistance(current, prev, next);

            if (distance > tolerance || current.break || current.missing) {
                simplified.push(current);
            }
        }

        simplified.push(points[points.length - 1]);
        return simplified;
    }

    /**
     * Calculate perpendicular distance from point to line
     */
    private static perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;

        if (dx === 0 && dy === 0) {
            return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
        }

        const numerator = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
        const denominator = Math.sqrt(dx * dx + dy * dy);

        return numerator / denominator;
    }

    /**
     * Decimate path to reduce point count while preserving shape
     */
    static decimatePath(points: PathPoint[], maxPoints: number): PathPoint[] {
        if (points.length <= maxPoints) return points;

        const step = points.length / maxPoints;
        const decimated: PathPoint[] = [];

        for (let i = 0; i < points.length; i += step) {
            const index = Math.floor(i);
            decimated.push(points[index]);
        }

        // Always include the last point
        if (decimated[decimated.length - 1] !== points[points.length - 1]) {
            decimated.push(points[points.length - 1]);
        }

        return decimated;
    }
}

/**
 * Utility functions for path operations
 */
export class CartesianPathUtils {
    /**
     * Convert array of points to path points with metadata
     */
    static pointsToPathPoints(points: Point[], xValues?: any[], yValues?: any[], missingData?: boolean[]): PathPoint[] {
        return points.map((point, index) => ({
            ...point,
            xDatum: xValues?.[index],
            yDatum: yValues?.[index],
            missing: missingData?.[index] ?? false,
        }));
    }

    /**
     * Calculate path bounds
     */
    static calculatePathBounds(points: PathPoint[]): {
        x: [number, number];
        y: [number, number];
    } {
        if (points.length === 0) {
            return { x: [0, 0], y: [0, 0] };
        }

        let xMin = Infinity,
            xMax = -Infinity;
        let yMin = Infinity,
            yMax = -Infinity;

        for (const point of points) {
            if (!point.missing) {
                xMin = Math.min(xMin, point.x);
                xMax = Math.max(xMax, point.x);
                yMin = Math.min(yMin, point.y);
                yMax = Math.max(yMax, point.y);
            }
        }

        return {
            x: [xMin === Infinity ? 0 : xMin, xMax === -Infinity ? 0 : xMax],
            y: [yMin === Infinity ? 0 : yMin, yMax === -Infinity ? 0 : yMax],
        };
    }

    /**
     * Split path at breaks or missing data
     */
    static splitPathAtBreaks(points: PathPoint[]): PathPoint[][] {
        const segments: PathPoint[][] = [];
        let currentSegment: PathPoint[] = [];

        for (const point of points) {
            if (point.break || point.missing) {
                if (currentSegment.length > 0) {
                    segments.push(currentSegment);
                    currentSegment = [];
                }
            } else {
                currentSegment.push(point);
            }
        }

        if (currentSegment.length > 0) {
            segments.push(currentSegment);
        }

        return segments;
    }
}
