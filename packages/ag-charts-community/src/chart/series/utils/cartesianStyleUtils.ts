import type { RequireOptional } from 'ag-charts-core';
import type {
    AgLineSeriesMarkerItemStylerParams,
    AgLineSeriesStylerResult,
    AgSeriesMarkerStyle,
} from 'ag-charts-types';

import type { BBox } from '../../../scene/bbox';
import type { CallbackParamRules } from '../../../util/callbackCache';
import { mergeDefaults } from '../../../util/object';
import type { Marker } from '../../marker/marker';
import { HighlightState, toHighlightString } from '../seriesProperties';

/**
 * Cartesian marker style configuration
 */
export interface CartesianMarkerStyleConfig {
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    size?: number;
    shape?: string;
    lineDash?: number[];
    lineDashOffset?: number;
    enabled?: boolean;
}

/**
 * Cartesian series style context
 */
export interface CartesianStyleContext {
    id: string;
    properties: {
        marker: CartesianMarkerStyleConfig & {
            itemStyler?: any;
        };
        stroke?: string;
        strokeWidth?: number;
        strokeOpacity?: number;
        lineDash?: number[];
        lineDashOffset?: number;
        styler?: any;
    };
    ctx: {
        highlightManager?: {
            getActiveHighlight(): any;
        };
    };
    getHighlightStyle(isHighlight: boolean, datumIndex: number, highlightState?: HighlightState): any;
    getHighlightStateString(activeHighlight: any, isHighlight: boolean, datumIndex: number): string;
    callWithContext(fn: any, params: any): any;
}

/**
 * Style options for marker application
 */
export interface MarkerStyleOptions {
    isHighlight?: boolean;
    checkForHighlight?: boolean;
    applyTranslation?: boolean;
    selected?: boolean;
}

/**
 * Cartesian marker style manager
 */
export class CartesianMarkerStyleManager {
    /**
     * Get complete marker styles for all highlight states
     */
    static getMarkerStyles<T extends CartesianStyleContext>(
        series: T,
        markerConfig: CartesianMarkerStyleConfig,
        lineStyle: {
            stroke?: string;
            strokeWidth?: number;
            strokeOpacity?: number;
        }
    ): Record<string, Required<AgSeriesMarkerStyle>> {
        const styles: Record<string, Required<AgSeriesMarkerStyle>> = {};

        // Generate styles for all highlight states
        for (const state of Object.values(HighlightState)) {
            const styleKey = toHighlightString(state);
            const isHighlight = state !== HighlightState.None;

            styles[styleKey] = this.createMarkerStyle(series, markerConfig, lineStyle, {
                isHighlight,
                checkForHighlight: false,
            });
        }

        return styles;
    }

    /**
     * Create marker style for specific conditions
     */
    static createMarkerStyle<T extends CartesianStyleContext>(
        series: T,
        markerConfig: CartesianMarkerStyleConfig,
        lineStyle: {
            stroke?: string;
            strokeWidth?: number;
            strokeOpacity?: number;
        },
        options: MarkerStyleOptions = {}
    ): Required<AgSeriesMarkerStyle> {
        const { isHighlight = false } = options;
        const { stroke, strokeWidth, strokeOpacity } = lineStyle;

        const baseStyle = {
            size: markerConfig.size ?? 6,
            shape: markerConfig.shape ?? 'circle',
            fill: markerConfig.fill ?? 'transparent',
            fillOpacity: markerConfig.fillOpacity ?? 1,
            stroke: markerConfig.stroke ?? stroke ?? '#000000',
            strokeWidth: markerConfig.strokeWidth ?? strokeWidth ?? 1,
            strokeOpacity: markerConfig.strokeOpacity ?? strokeOpacity ?? 1,
            lineDash: markerConfig.lineDash ?? [],
            lineDashOffset: markerConfig.lineDashOffset ?? 0,
        };

        // Apply highlight modifications if needed
        if (isHighlight) {
            return {
                ...baseStyle,
                strokeWidth: Math.max(baseStyle.strokeWidth, 2),
                strokeOpacity: Math.min(baseStyle.strokeOpacity * 1.2, 1),
            };
        }

        return baseStyle;
    }

    /**
     * Get marker style with item styler support
     */
    static getMarkerStyleWithItemStyler<TDatum>(
        series: CartesianStyleContext,
        markerConfig: CartesianMarkerStyleConfig & { itemStyler?: any },
        datum: { datumIndex: number; datum?: any },
        itemStylerParams?: AgLineSeriesMarkerItemStylerParams<any, any>,
        options: MarkerStyleOptions = {},
        defaultStyle?: Required<AgSeriesMarkerStyle>,
        lineStyle?: { stroke?: string; strokeWidth?: number; strokeOpacity?: number }
    ): Required<AgSeriesMarkerStyle> {
        const baseStyle = defaultStyle || this.createMarkerStyle(series, markerConfig, lineStyle || {}, options);

        // Apply item styler if present
        if (markerConfig.itemStyler && itemStylerParams) {
            const { isHighlight = false } = options;
            const stylerResult = series.callWithContext(markerConfig.itemStyler, {
                ...itemStylerParams,
                highlighted: isHighlight,
                highlightState: series.getHighlightStateString(
                    series.ctx.highlightManager?.getActiveHighlight(),
                    isHighlight,
                    datum.datumIndex
                ),
            });

            if (stylerResult) {
                return mergeDefaults(stylerResult, baseStyle);
            }
        }

        return baseStyle;
    }

    /**
     * Apply marker style to DOM node
     */
    static applyMarkerStyle(
        style: Required<AgSeriesMarkerStyle>,
        marker: Marker,
        point: { x: number; y: number; size?: number },
        fillBBox: BBox | undefined,
        options: MarkerStyleOptions = {}
    ): void {
        const { applyTranslation = false, selected = false } = options;

        // Apply basic style properties
        marker.shape = style.shape;
        marker.size = point.size ?? style.size;
        marker.fill = style.fill;
        marker.fillOpacity = style.fillOpacity;
        marker.stroke = style.stroke;
        marker.strokeWidth = style.strokeWidth;
        marker.strokeOpacity = style.strokeOpacity;
        marker.lineDash = style.lineDash;
        marker.lineDashOffset = style.lineDashOffset;

        // Apply positioning if needed
        if (applyTranslation) {
            marker.translationX = point.x;
            marker.translationY = point.y;
        }

        // Apply selection state
        if (selected) {
            marker.strokeWidth = Math.max(marker.strokeWidth, 2);
        }

        // Handle visibility based on bounds
        if (fillBBox) {
            const markerBBox = marker.computeBBox();
            marker.visible = fillBBox.containsPoint(point.x, point.y) || fillBBox.intersects(markerBBox);
        } else {
            marker.visible = true;
        }
    }
}

/**
 * Cartesian line/path style manager
 */
export class CartesianPathStyleManager {
    /**
     * Get line style for different highlight states
     */
    static getLineStyles(
        baseStyle: {
            stroke?: string;
            strokeWidth?: number;
            strokeOpacity?: number;
            lineDash?: number[];
            lineDashOffset?: number;
        },
        isHighlight: boolean = false
    ): Required<{
        stroke: string;
        strokeWidth: number;
        strokeOpacity: number;
        lineDash: number[];
        lineDashOffset: number;
    }> {
        const style = {
            stroke: baseStyle.stroke ?? '#000000',
            strokeWidth: baseStyle.strokeWidth ?? 2,
            strokeOpacity: baseStyle.strokeOpacity ?? 1,
            lineDash: baseStyle.lineDash ?? [],
            lineDashOffset: baseStyle.lineDashOffset ?? 0,
        };

        // Apply highlight modifications
        if (isHighlight) {
            return {
                ...style,
                strokeWidth: Math.max(style.strokeWidth, 3),
                strokeOpacity: Math.min(style.strokeOpacity * 1.1, 1),
            };
        }

        return style;
    }

    /**
     * Apply dash array patterns for different line types
     */
    static applyDashPattern(
        baseDash: number[],
        strokeWidth: number,
        pattern?: 'solid' | 'dash' | 'dot' | 'dashdot'
    ): number[] {
        if (pattern === 'solid' || !pattern) {
            return baseDash;
        }

        const dashUnit = strokeWidth * 2;

        switch (pattern) {
            case 'dash':
                return [dashUnit * 2, dashUnit];
            case 'dot':
                return [dashUnit * 0.5, dashUnit];
            case 'dashdot':
                return [dashUnit * 2, dashUnit, dashUnit * 0.5, dashUnit];
            default:
                return baseDash;
        }
    }
}

/**
 * Cartesian highlight style manager
 */
export class CartesianHighlightStyleManager {
    /**
     * Create highlight style configuration
     */
    static createHighlightStyle(
        baseStyle: any,
        highlightState: HighlightState,
        options: {
            opacityFactor?: number;
            strokeWidthBoost?: number;
            brightnessBoost?: number;
        } = {}
    ): any {
        const { opacityFactor = 0.8, strokeWidthBoost = 1, brightnessBoost = 0.1 } = options;

        switch (highlightState) {
            case HighlightState.Active:
                return {
                    ...baseStyle,
                    strokeWidth: Math.max(baseStyle.strokeWidth + strokeWidthBoost, 2),
                    opacity: Math.min((baseStyle.opacity ?? 1) + brightnessBoost, 1),
                };

            case HighlightState.Inactive:
                return {
                    ...baseStyle,
                    opacity: (baseStyle.opacity ?? 1) * opacityFactor,
                };

            case HighlightState.Series:
                return {
                    ...baseStyle,
                    strokeWidth: Math.max(baseStyle.strokeWidth + strokeWidthBoost, 2),
                };

            default:
                return baseStyle;
        }
    }

    /**
     * Get highlight state from conditions
     */
    static getHighlightState(activeHighlight: any, isHighlight: boolean, datumIndex: number): HighlightState {
        if (!activeHighlight) {
            return HighlightState.None;
        }

        if (isHighlight || activeHighlight.datumIndex === datumIndex) {
            return HighlightState.Active;
        }

        return HighlightState.Inactive;
    }
}

/**
 * Style utility functions for Cartesian series
 */
export class CartesianStyleUtils {
    /**
     * Check if marker should be enabled based on data density
     */
    static shouldEnableMarkers(dataCount: number, xScale: any, markerConfig: CartesianMarkerStyleConfig): boolean {
        if (!markerConfig.enabled) return false;

        // Auto-hide markers if too dense
        const [r0, r1] = xScale.range || [0, 1];
        const range = Math.abs(r1 - r0);
        const density = dataCount / range;

        // Hide markers if more than 1 point per 10 pixels
        return density <= 0.1;
    }

    /**
     * Calculate optimal marker size based on available space
     */
    static calculateOptimalMarkerSize(baseSize: number, dataCount: number, availableWidth: number): number {
        const minSize = 2;
        const maxSize = baseSize;

        // Reduce size if data is very dense
        const density = dataCount / availableWidth;
        if (density > 0.1) {
            const reductionFactor = Math.max(0.3, 1 - density);
            return Math.max(minSize, baseSize * reductionFactor);
        }

        return maxSize;
    }

    /**
     * Merge multiple style configurations
     */
    static mergeStyleConfigurations(
        base: Partial<CartesianMarkerStyleConfig>,
        ...overrides: Array<Partial<CartesianMarkerStyleConfig> | undefined>
    ): CartesianMarkerStyleConfig {
        return mergeDefaults(base, ...overrides.filter(Boolean));
    }

    /**
     * Convert marker style to legend symbol options
     */
    static createLegendSymbolOptions(
        markerStyle: Required<AgSeriesMarkerStyle>,
        lineStyle: {
            stroke?: string;
            strokeWidth?: number;
            strokeOpacity?: number;
            lineDash?: number[];
        },
        markerEnabled: boolean
    ): any {
        return {
            marker: markerEnabled
                ? {
                      fill: markerStyle.fill,
                      stroke: markerStyle.stroke,
                      fillOpacity: markerStyle.fillOpacity,
                      strokeOpacity: markerStyle.strokeOpacity,
                      strokeWidth: markerStyle.strokeWidth,
                      size: markerStyle.size,
                      shape: markerStyle.shape,
                      enabled: true,
                  }
                : {
                      enabled: false,
                  },
            line: {
                stroke: lineStyle.stroke,
                strokeOpacity: lineStyle.strokeOpacity,
                strokeWidth: lineStyle.strokeWidth,
                lineDash: lineStyle.lineDash,
            },
        };
    }
}
