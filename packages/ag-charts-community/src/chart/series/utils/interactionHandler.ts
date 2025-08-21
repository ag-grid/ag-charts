import { BBox } from '../../../scene/bbox';
import type { CartesianSeriesNodeDatum } from '../cartesian/cartesianSeries';
import type { LineNodeDatum } from '../cartesian/lineUtil';
import { computeMarkerFocusBounds } from '../cartesian/markerUtil';
import type { PickFocusInputs } from '../series';
import type { InteractionHandler } from './interfaces';

/**
 * Base interaction handler for common functionality
 */
export abstract class BaseInteractionHandler<TDatum extends CartesianSeriesNodeDatum>
    implements InteractionHandler<TDatum>
{
    abstract computeFocusBounds(opts: any): any;
    abstract pickNode(point: { x: number; y: number }, nodeData: TDatum[]): TDatum | undefined;
    abstract getDistanceToNode(point: { x: number; y: number }, datum: TDatum): number;

    /**
     * Helper method to compute distance between two points
     */
    protected getPointDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Helper method to check if a point is within a bounding box
     */
    protected isPointInBounds(point: { x: number; y: number }, bounds: BBox): boolean {
        return (
            point.x >= bounds.x &&
            point.x <= bounds.x + bounds.width &&
            point.y >= bounds.y &&
            point.y <= bounds.y + bounds.height
        );
    }
}

/**
 * Cartesian-specific interaction handler for Line/Area/Bar series
 */
export class CartesianInteractionHandler extends BaseInteractionHandler<LineNodeDatum> {
    private readonly series: any; // Would be the actual series instance in real implementation

    constructor(series?: any) {
        super();
        this.series = series;
    }

    computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        if (!this.series) return undefined;
        return computeMarkerFocusBounds(this.series, opts);
    }

    pickNode(point: { x: number; y: number }, nodeData: LineNodeDatum[]): LineNodeDatum | undefined {
        if (!nodeData || nodeData.length === 0) return undefined;

        let closestDatum: LineNodeDatum | undefined;
        let minDistance = Infinity;

        for (const datum of nodeData) {
            if (!datum.point) continue;

            const distance = this.getDistanceToNode(point, datum);
            if (distance < minDistance) {
                minDistance = distance;
                closestDatum = datum;
            }
        }

        // Only return if within reasonable distance (e.g., 50 pixels)
        if (minDistance <= 50) {
            return closestDatum;
        }

        return undefined;
    }

    getDistanceToNode(point: { x: number; y: number }, datum: LineNodeDatum): number {
        if (!datum.point) return Infinity;
        return this.getPointDistance(point, datum.point);
    }

    /**
     * Finds the closest datum along the X-axis (for axis-aligned picking)
     */
    pickNodeAxisAligned(
        point: { x: number; y: number },
        nodeData: LineNodeDatum[],
        axisDirection: 'x' | 'y' = 'x'
    ): LineNodeDatum | undefined {
        if (!nodeData || nodeData.length === 0) return undefined;

        let closestDatum: LineNodeDatum | undefined;
        let minDistance = Infinity;

        for (const datum of nodeData) {
            if (!datum.point) continue;

            const distance =
                axisDirection === 'x' ? Math.abs(point.x - datum.point.x) : Math.abs(point.y - datum.point.y);

            if (distance < minDistance) {
                minDistance = distance;
                closestDatum = datum;
            }
        }

        return closestDatum;
    }

    /**
     * Computes focus bounds for a specific datum
     */
    computeDatumFocusBounds(datum: LineNodeDatum, pixelSize: number = 1): BBox | undefined {
        if (!datum.point) return undefined;

        const { x, y, size } = datum.point;
        const radius = (size || 4) * pixelSize * 0.5;

        return new BBox(x - radius, y - radius, radius * 2, radius * 2);
    }

    /**
     * Gets all datums within a specified distance from a point
     */
    getDatumsWithinDistance(
        point: { x: number; y: number },
        nodeData: LineNodeDatum[],
        maxDistance: number
    ): LineNodeDatum[] {
        if (!nodeData) return [];

        return nodeData.filter((datum) => {
            if (!datum.point) return false;
            return this.getDistanceToNode(point, datum) <= maxDistance;
        });
    }

    /**
     * Computes the highlight state for interaction
     */
    getHighlightState(activeHighlight: any, isHighlighted: boolean, datumIndex: number): string {
        if (!activeHighlight) return 'none';
        if (activeHighlight.datumIndex === datumIndex) return 'highlighted';
        if (isHighlighted) return 'series-highlighted';
        return 'dimmed';
    }
}

/**
 * Specialized interaction handler for different series types
 */
export class LineInteractionHandler extends CartesianInteractionHandler {
    /**
     * Line-specific picking that considers the line path in addition to markers
     */
    pickNodeOrPath(
        point: { x: number; y: number },
        nodeData: LineNodeDatum[],
        _strokeData?: any
    ): LineNodeDatum | undefined {
        // First try to pick a marker node
        const markerPick = this.pickNode(point, nodeData);
        if (markerPick) return markerPick;

        // If no marker was picked, try axis-aligned picking for line interaction
        return this.pickNodeAxisAligned(point, nodeData, 'x');
    }

    /**
     * Gets the interpolated position on the line for a given X coordinate
     */
    getInterpolatedPosition(
        xPosition: number,
        nodeData: LineNodeDatum[]
    ): { x: number; y: number; datum?: LineNodeDatum } | undefined {
        if (!nodeData || nodeData.length < 2) return undefined;

        // Find the two closest data points
        let leftDatum: LineNodeDatum | undefined;
        let rightDatum: LineNodeDatum | undefined;

        for (const datum of nodeData) {
            if (!datum.point) continue;

            if (datum.point.x <= xPosition) {
                if (!leftDatum || datum.point.x > leftDatum.point.x) {
                    leftDatum = datum;
                }
            }
            if (datum.point.x >= xPosition) {
                if (!rightDatum || datum.point.x < rightDatum.point.x) {
                    rightDatum = datum;
                }
            }
        }

        if (!leftDatum && !rightDatum) return undefined;
        if (!leftDatum) return { x: rightDatum!.point.x, y: rightDatum!.point.y, datum: rightDatum };
        if (!rightDatum) return { x: leftDatum.point.x, y: leftDatum.point.y, datum: leftDatum };

        // Interpolate between the two points
        const leftX = leftDatum.point.x;
        const rightX = rightDatum.point.x;
        const leftY = leftDatum.point.y;
        const rightY = rightDatum.point.y;

        const ratio = (xPosition - leftX) / (rightX - leftX);
        const interpolatedY = leftY + ratio * (rightY - leftY);

        return {
            x: xPosition,
            y: interpolatedY,
            datum: ratio < 0.5 ? leftDatum : rightDatum,
        };
    }
}
