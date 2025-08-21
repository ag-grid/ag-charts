import type { Point } from 'ag-charts-core';
import { clamp } from 'ag-charts-core';
import type { AgMarkerShape, AgSeriesMarkerStyle } from 'ag-charts-types';

import { QUICK_TRANSITION } from '../../../motion/animation';
import * as easing from '../../../motion/easing';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { NODE_UPDATE_STATE_TO_PHASE_MAPPING, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import type { Scale } from '../../../scale/scale';
import { BBox } from '../../../scene/bbox';
import type { Node } from '../../../scene/node';
import type { SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Transformable } from '../../../scene/transformable';
import { findRangeExtent } from '../../../util/number';
import type { AnimationManager } from '../../interaction/animationManager';
import { Marker } from '../../marker/marker';
import type { PickFocusInputs } from '../series';
import type { SeriesMarker } from '../seriesMarker';
import { HighlightState, highlightStates } from '../seriesProperties';
import type { ISeries, NodeDataDependant, SeriesNodeDatum } from '../seriesTypes';

/**
 * Marker configuration interface for Cartesian series
 */
export interface CartesianMarkerConfig {
    enabled: boolean;
    autoHide?: boolean | number;
    size: number;
    shape?: AgMarkerShape;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    itemStyler?: any;
}

/**
 * Marker datum interface
 */
export interface MarkerNodeDatum extends SeriesNodeDatum<unknown> {
    readonly point: Point & SizedPoint;
    readonly midPoint?: Point;
}

/**
 * Series interface that supports markers
 */
export interface MarkerSeries<TDatum extends MarkerNodeDatum> extends ISeries<number, TDatum, unknown, unknown> {
    getNodeData(): { [index: number]: TDatum | undefined } | undefined;
    getFormattedMarkerStyle(datum: TDatum): { size: number; shape?: AgMarkerShape };
}

/**
 * Series properties for marker styling
 */
export interface MarkerSeriesStylerProps<TStylerParams> {
    properties: { styler?: (params: TStylerParams) => { marker?: AgSeriesMarkerStyle } | undefined };
    callWithContext(
        styler: (params: TStylerParams) => { marker?: AgSeriesMarkerStyle } | undefined,
        params: TStylerParams
    ): { marker?: AgSeriesMarkerStyle } | undefined;
    getMarkerStyle<TParams>(
        marker: SeriesMarker<TParams>,
        nodeDatum: object,
        params?: TParams,
        opts?: { highlightState?: HighlightState },
        defaultOverrideStyle?: AgSeriesMarkerStyle & { size: number },
        inheritedStyle?: AgSeriesMarkerStyle
    ): AgSeriesMarkerStyle & { size: number };
    makeStylerParams(highlighted: boolean, highlightStateEnum?: HighlightState): TStylerParams;
}

/**
 * Marker animation manager for Cartesian series
 */
export class CartesianMarkerAnimationManager {
    /**
     * Fade-in animation for markers
     */
    static markerFadeInAnimation<T>(
        seriesId: string,
        animationManager: AnimationManager,
        status?: NodeUpdateState,
        ...markerSelections: Selection<Node & { opacity: number }, T>[]
    ): void {
        const params = { phase: status ? NODE_UPDATE_STATE_TO_PHASE_MAPPING[status] : 'trailing' };
        staticFromToMotion(
            seriesId,
            'markers',
            animationManager,
            markerSelections,
            { opacity: 0 },
            { opacity: 1 },
            params
        );
        markerSelections.forEach((s) => s.cleanup());
    }

    /**
     * Scale-in animation for markers
     */
    static markerScaleInAnimation<T>(
        seriesId: string,
        animationManager: AnimationManager,
        ...markerSelections: Selection<Node, T>[]
    ): void {
        staticFromToMotion(
            seriesId,
            'markers',
            animationManager,
            markerSelections,
            { scalingX: 0, scalingY: 0 },
            { scalingX: 1, scalingY: 1 },
            { phase: 'initial' }
        );
        markerSelections.forEach((s) => s.cleanup());
    }

    /**
     * Swipe scale-in animation with progressive delay
     */
    static markerSwipeScaleInAnimation<T extends MarkerNodeDatum>(
        seriesInfo: { id: string } & NodeDataDependant,
        animationManager: AnimationManager,
        ...markerSelections: Selection<Node, T>[]
    ): void {
        const { id, nodeDataDependencies } = seriesInfo;
        const seriesWidth: number = nodeDataDependencies.seriesRectWidth;

        const fromFn = (_: Node, datum: T) => {
            const x = datum.midPoint?.x ?? seriesWidth;
            // Calculate delay based on X position for left-to-right animation
            let delay = clamp(0, easing.inverseEaseOut(x / seriesWidth), 1);
            if (isNaN(delay)) {
                delay = 0;
            }
            return { scalingX: 0, scalingY: 0, delay, duration: QUICK_TRANSITION, phase: 'initial' as const };
        };

        const toFn = () => ({ scalingX: 1, scalingY: 1 });

        fromToMotion(id, 'markers', animationManager, markerSelections, { fromFn, toFn });
    }

    /**
     * Reset marker animation properties
     */
    static resetMarkerFn(_node: Node & { opacity: number }): any {
        return { opacity: 1, scalingX: 1, scalingY: 1 };
    }

    /**
     * Reset marker position for animation
     */
    static resetMarkerPositionFn<T extends MarkerNodeDatum>(_node: Node, datum: T): any {
        return {
            x: datum.point?.x ?? NaN,
            y: datum.point?.y ?? NaN,
            scalingCenterX: datum.point?.x ?? NaN,
            scalingCenterY: datum.point?.y ?? NaN,
        };
    }
}

/**
 * Marker visibility and sizing manager
 */
export class CartesianMarkerVisibilityManager {
    /**
     * Determine if markers should be enabled based on data density
     */
    static markerEnabled(
        dataCount: number,
        scale: Scale<unknown, number, unknown>,
        marker: Pick<SeriesMarker<unknown>, 'enabled' | 'autoHide' | 'size'>
    ): boolean {
        if (!marker.enabled) return false;
        if (marker.autoHide === false) return true;

        const minSpacing = marker.autoHide === undefined ? 1 : marker.size;
        const step = scale.step ?? findRangeExtent(scale.range) / Math.max(1, dataCount);
        return step > minSpacing;
    }

    /**
     * Calculate optimal marker size based on data density
     */
    static calculateOptimalMarkerSize(
        baseSize: number,
        dataCount: number,
        scale: Scale<unknown, number, unknown>,
        options: {
            minSize?: number;
            maxSize?: number;
            densityThreshold?: number;
        } = {}
    ): number {
        const { minSize = 2, maxSize = baseSize, densityThreshold = 0.1 } = options;

        const step = scale.step ?? findRangeExtent(scale.range) / Math.max(1, dataCount);

        if (step < baseSize) {
            // Reduce size when markers would overlap
            const scaleFactor = Math.max(minSize / baseSize, step / baseSize);
            return Math.max(minSize, baseSize * scaleFactor);
        }

        return Math.min(maxSize, baseSize);
    }

    /**
     * Auto-hide markers based on data density and zoom level
     */
    static shouldAutoHideMarkers(
        dataCount: number,
        viewportWidth: number,
        markerSize: number,
        autoHideThreshold: number = 0.5
    ): boolean {
        const density = dataCount / viewportWidth;
        const markerDensity = density * markerSize;
        return markerDensity > autoHideThreshold;
    }
}

/**
 * Marker focus and interaction utilities
 */
export class CartesianMarkerInteractionManager {
    /**
     * Compute focus bounds for marker interaction
     */
    static computeMarkerFocusBounds<TDatum extends MarkerNodeDatum>(
        series: MarkerSeries<TDatum>,
        { datumIndex }: PickFocusInputs
    ): BBox | undefined {
        const nodeData = series.getNodeData();
        if (nodeData === undefined) return undefined;

        const datum = nodeData[datumIndex];
        const { point } = datum ?? {};
        if (datum == null || point == null) return undefined;

        const style = series.getFormattedMarkerStyle(datum);
        const anchor = Marker.anchor(style.shape);
        const size = point.focusSize ?? style.size;
        const paddedSize = 4 + size; // Add 2px padding on all sides
        const paddedRadius = paddedSize / 2;
        const anchorX = (anchor.x - 0.5) * size;
        const anchorY = (anchor.y - 0.5) * size;
        const x = datum.point.x - paddedRadius - anchorX;
        const y = datum.point.y - paddedRadius - anchorY;

        return Transformable.toCanvas(series.contentGroup, new BBox(x, y, paddedSize, paddedSize));
    }

    /**
     * Find nearest marker to a point
     */
    static findNearestMarker<TDatum extends MarkerNodeDatum>(
        nodeData: TDatum[],
        point: Point,
        maxDistance: number = Infinity
    ): { datum: TDatum; distance: number } | undefined {
        let nearestDatum: TDatum | undefined;
        let minDistance = maxDistance;

        for (const datum of nodeData) {
            if (!datum.point) continue;

            const dx = datum.point.x - point.x;
            const dy = datum.point.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearestDatum = datum;
            }
        }

        return nearestDatum ? { datum: nearestDatum, distance: minDistance } : undefined;
    }

    /**
     * Check if point is within marker bounds
     */
    static isPointInMarker(
        point: Point,
        markerPoint: Point & SizedPoint,
        markerShape?: AgMarkerShape,
        tolerance: number = 0
    ): boolean {
        const size = markerPoint.size || 6;
        const radius = (size + tolerance) / 2;
        const dx = point.x - markerPoint.x;
        const dy = point.y - markerPoint.y;

        switch (markerShape) {
            case 'circle':
                return dx * dx + dy * dy <= radius * radius;
            case 'square':
            case 'diamond':
                return Math.abs(dx) <= radius && Math.abs(dy) <= radius;
            default:
                // Default to circular hit testing
                return dx * dx + dy * dy <= radius * radius;
        }
    }
}

/**
 * Marker styling utilities for Cartesian series
 */
export class CartesianMarkerStyleManager {
    /**
     * Get marker styles for all highlight states
     */
    static getMarkerStyles<TStylerParams, TItemStylerParams>(
        series: MarkerSeriesStylerProps<TStylerParams>,
        marker: SeriesMarker<TItemStylerParams>,
        inheritedStyle?: AgSeriesMarkerStyle
    ): Record<HighlightState, AgSeriesMarkerStyle> {
        return highlightStates.reduce(
            (styles, state) => {
                let defaultOverrideStyle: (AgSeriesMarkerStyle & { size: number }) | undefined;

                if (series.properties.styler) {
                    const params = series.makeStylerParams(state !== HighlightState.None, state);
                    const result = series.callWithContext(series.properties.styler, params);
                    if (result?.marker != null) {
                        defaultOverrideStyle = { ...result.marker, size: result.marker.size ?? marker.size };
                    }
                }

                styles[state] = series.getMarkerStyle(
                    marker,
                    {},
                    undefined,
                    { highlightState: state },
                    defaultOverrideStyle,
                    inheritedStyle
                );
                return styles;
            },
            {} as Record<HighlightState, AgSeriesMarkerStyle>
        );
    }

    /**
     * Apply marker styles to node
     */
    static applyMarkerStyle(
        marker: Marker,
        style: AgSeriesMarkerStyle & { size: number },
        position: Point & { size?: number },
        options: {
            applyTranslation?: boolean;
            visible?: boolean;
            opacity?: number;
        } = {}
    ): void {
        const { applyTranslation = true, visible = true, opacity } = options;

        // Apply style properties
        marker.shape = style.shape || 'circle';
        marker.size = position.size ?? style.size;
        marker.fill = style.fill;
        marker.fillOpacity = style.fillOpacity;
        marker.stroke = style.stroke;
        marker.strokeWidth = style.strokeWidth;
        marker.strokeOpacity = style.strokeOpacity;
        marker.lineDash = style.lineDash;
        marker.lineDashOffset = style.lineDashOffset;

        // Apply position
        if (applyTranslation) {
            marker.translationX = position.x;
            marker.translationY = position.y;
        }

        // Apply visibility and opacity
        marker.visible = visible;
        if (opacity !== undefined) {
            marker.opacity = opacity;
        }
    }

    /**
     * Create marker style with highlight modifications
     */
    static createHighlightMarkerStyle(
        baseStyle: AgSeriesMarkerStyle & { size: number },
        highlightState: HighlightState,
        options: {
            sizeMultiplier?: number;
            strokeWidthBoost?: number;
            opacityFactor?: number;
        } = {}
    ): AgSeriesMarkerStyle & { size: number } {
        const { sizeMultiplier = 1.2, strokeWidthBoost = 1, opacityFactor = 0.7 } = options;

        switch (highlightState) {
            case HighlightState.Active:
                return {
                    ...baseStyle,
                    size: Math.round(baseStyle.size * sizeMultiplier),
                    strokeWidth: Math.max((baseStyle.strokeWidth ?? 1) + strokeWidthBoost, 1),
                };

            case HighlightState.Inactive:
                return {
                    ...baseStyle,
                    fillOpacity: (baseStyle.fillOpacity ?? 1) * opacityFactor,
                    strokeOpacity: (baseStyle.strokeOpacity ?? 1) * opacityFactor,
                };

            case HighlightState.Series:
                return {
                    ...baseStyle,
                    strokeWidth: Math.max((baseStyle.strokeWidth ?? 1) + strokeWidthBoost, 1),
                };

            default:
                return baseStyle;
        }
    }
}

/**
 * Marker factory and creation utilities
 */
export class CartesianMarkerFactory {
    /**
     * Create marker node with default properties
     */
    static createMarker(config?: Partial<CartesianMarkerConfig>): Marker {
        const marker = new Marker();

        if (config) {
            marker.shape = config.shape || 'circle';
            marker.size = config.size || 6;
            marker.fill = config.fill;
            marker.fillOpacity = config.fillOpacity;
            marker.stroke = config.stroke;
            marker.strokeWidth = config.strokeWidth;
            marker.strokeOpacity = config.strokeOpacity;
            marker.lineDash = config.lineDash;
            marker.lineDashOffset = config.lineDashOffset;
            marker.visible = config.enabled ?? true;
        }

        return marker;
    }

    /**
     * Clone marker with new properties
     */
    static cloneMarker(source: Marker, overrides?: Partial<CartesianMarkerConfig>): Marker {
        const marker = new Marker();

        // Copy from source
        marker.shape = source.shape;
        marker.size = source.size;
        marker.fill = source.fill;
        marker.fillOpacity = source.fillOpacity;
        marker.stroke = source.stroke;
        marker.strokeWidth = source.strokeWidth;
        marker.strokeOpacity = source.strokeOpacity;
        marker.lineDash = source.lineDash;
        marker.lineDashOffset = source.lineDashOffset;
        marker.visible = source.visible;

        // Apply overrides
        if (overrides) {
            if (overrides.shape !== undefined) marker.shape = overrides.shape;
            if (overrides.size !== undefined) marker.size = overrides.size;
            if (overrides.fill !== undefined) marker.fill = overrides.fill;
            if (overrides.fillOpacity !== undefined) marker.fillOpacity = overrides.fillOpacity;
            if (overrides.stroke !== undefined) marker.stroke = overrides.stroke;
            if (overrides.strokeWidth !== undefined) marker.strokeWidth = overrides.strokeWidth;
            if (overrides.strokeOpacity !== undefined) marker.strokeOpacity = overrides.strokeOpacity;
            if (overrides.lineDash !== undefined) marker.lineDash = overrides.lineDash;
            if (overrides.lineDashOffset !== undefined) marker.lineDashOffset = overrides.lineDashOffset;
            if (overrides.enabled !== undefined) marker.visible = overrides.enabled;
        }

        return marker;
    }

    /**
     * Batch create markers for data set
     */
    static createMarkers(count: number, config?: Partial<CartesianMarkerConfig>): Marker[] {
        const markers: Marker[] = [];
        for (let i = 0; i < count; i++) {
            markers.push(this.createMarker(config));
        }
        return markers;
    }
}

/**
 * Comprehensive marker management utilities
 */
export class CartesianMarkerUtils {
    /**
     * Update marker selection with data
     */
    static updateMarkerSelection<TDatum extends MarkerNodeDatum>(
        selection: Selection<Marker, TDatum>,
        nodeData: TDatum[],
        enabled: boolean,
        keyFn?: (datum: TDatum) => string
    ): Selection<Marker, TDatum> {
        const data = enabled ? nodeData : [];
        return selection.update(data, undefined, keyFn);
    }

    /**
     * Apply style and position to marker selection
     */
    static applyMarkerSelectionStyles<TDatum extends MarkerNodeDatum>(
        selection: Selection<Marker, TDatum>,
        getStyle: (datum: TDatum, index: number) => AgSeriesMarkerStyle & { size: number },
        options: {
            applyTranslation?: boolean;
            visible?: boolean;
        } = {}
    ): void {
        selection.each((marker, datum, index) => {
            const style = getStyle(datum, index);
            CartesianMarkerStyleManager.applyMarkerStyle(marker, style, datum.point, options);
        });
    }

    /**
     * Calculate marker bounds for a dataset
     */
    static calculateMarkerBounds<TDatum extends MarkerNodeDatum>(
        nodeData: TDatum[],
        getMarkerSize: (datum: TDatum) => number
    ): BBox | undefined {
        if (nodeData.length === 0) return undefined;

        let minX = Infinity,
            maxX = -Infinity;
        let minY = Infinity,
            maxY = -Infinity;

        for (const datum of nodeData) {
            if (!datum.point) continue;

            const size = getMarkerSize(datum);
            const radius = size / 2;

            minX = Math.min(minX, datum.point.x - radius);
            maxX = Math.max(maxX, datum.point.x + radius);
            minY = Math.min(minY, datum.point.y - radius);
            maxY = Math.max(maxY, datum.point.y + radius);
        }

        if (minX === Infinity) return undefined;

        return new BBox(minX, minY, maxX - minX, maxY - minY);
    }
}
