import { type InternalAgColorType, type InternalAgGradientColor } from 'ag-charts-core';
import type { AgDonutSeriesStyle, AgPieSeriesStyle } from 'ag-charts-types';

import type { GradientParams } from '../../../scene/gradient/gradient';
import { isGradientFill } from '../../../scene/util/fill';
import { mergeDefaults } from '../../../util/object';
import type { HighlightState } from '../seriesProperties';

/**
 * Combined style interface for pie/donut series
 */
export interface PieDonutSeriesStyle extends AgDonutSeriesStyle, AgPieSeriesStyle {}

/**
 * Style context interface
 */
export interface StyleContext {
    id: string;
    properties: {
        fills?: InternalAgColorType[];
        strokes?: InternalAgColorType[];
        itemStyler?: any;
        angleKey?: string;
        radiusKey?: string;
        calloutLabelKey?: string;
        sectorLabelKey?: string;
        legendItemKey?: string;
        fillOpacity?: number;
        strokeOpacity?: number;
        strokeWidth?: number;
        lineDash?: number[];
        lineDashOffset?: number;
        cornerRadius?: number;
        opacity?: number;
    };
    ctx: {
        optionsGraphService: {
            resolvePartial(path: string[], value: any, options?: any): any;
        };
        highlightManager?: {
            getActiveHighlight(): any;
        };
    };
    declarationOrder: number;
    cachedDatumCallback(key: string, fn: () => any): any;
    callWithContext(fn: any, params: any): any;
    getFormatterContext(property: string): any;
    getHighlightStyle(
        isHighlight: boolean,
        datumIndex: number,
        highlightState?: HighlightState,
        legendItemValues?: string[]
    ): any;
    getHighlightStateString(activeHighlight: any, isHighlight: boolean, datumIndex: number): string;
}

/**
 * Style item data interface
 */
export interface StyleItemData {
    datum: any;
    datumIndex: number;
}

/**
 * Style calculation result
 */
export interface StyleResult {
    fill?: InternalAgColorType;
    fillOpacity?: number;
    stroke?: InternalAgColorType;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    cornerRadius?: number;
    opacity?: number;
}

/**
 * Style management utilities for polar series
 */
export class PolarStyleManager {
    constructor(private readonly context: StyleContext) {}

    /**
     * Get complete item style including highlights and formatters
     */
    getItemStyle(
        itemData: StyleItemData,
        isHighlight: boolean,
        highlightState?: HighlightState,
        legendItemValues?: string[]
    ): StyleResult {
        const { datum, datumIndex } = itemData;
        const { properties } = this.context;
        const {
            angleKey,
            radiusKey,
            calloutLabelKey,
            sectorLabelKey,
            legendItemKey,
            fills = [],
            strokes = [],
            itemStyler,
        } = properties;

        const defaultStroke = strokes[datumIndex % strokes.length];
        const defaultFill = fills[datumIndex % fills.length];

        const baseStyle = this.context.getHighlightStyle(isHighlight, datumIndex, highlightState, legendItemValues);

        const mergedStyle = mergeDefaults(
            baseStyle,
            {
                fill: defaultFill,
                stroke: defaultStroke,
            },
            properties
        );

        let format: PieDonutSeriesStyle | undefined;
        if (itemStyler) {
            format = this.context.cachedDatumCallback(
                this.context.id + '-' + datumIndex + (isHighlight ? '-highlight' : '-normal'),
                () => {
                    return this.context.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.context.declarationOrder}`],
                        this.context.callWithContext(itemStyler, {
                            datum,
                            angleKey,
                            radiusKey,
                            calloutLabelKey,
                            sectorLabelKey,
                            legendItemKey,
                            fill: mergedStyle.fill,
                            fillOpacity: mergedStyle.fillOpacity,
                            stroke: mergedStyle.stroke,
                            strokeWidth: mergedStyle.strokeWidth,
                            strokeOpacity: mergedStyle.strokeOpacity,
                            lineDash: mergedStyle.lineDash,
                            lineDashOffset: mergedStyle.lineDashOffset,
                            cornerRadius: mergedStyle.cornerRadius,
                            highlighted: isHighlight,
                            highlightState: this.context.getHighlightStateString(
                                this.context.ctx.highlightManager?.getActiveHighlight(),
                                isHighlight,
                                datumIndex
                            ),
                            seriesId: this.context.id,
                        }),
                        {
                            proxyPaths: {
                                fill: ['fills', `${datumIndex}`],
                                stroke: ['strokes', `${datumIndex}`],
                            },
                        }
                    );
                }
            );
        }

        return {
            fill: format?.fill ?? mergedStyle.fill,
            fillOpacity: format?.fillOpacity ?? mergedStyle.fillOpacity,
            stroke: format?.stroke ?? mergedStyle.stroke,
            strokeWidth: format?.strokeWidth ?? mergedStyle.strokeWidth,
            strokeOpacity: format?.strokeOpacity ?? mergedStyle.strokeOpacity,
            lineDash: format?.lineDash ?? mergedStyle.lineDash,
            lineDashOffset: format?.lineDashOffset ?? mergedStyle.lineDashOffset,
            cornerRadius: format?.cornerRadius ?? mergedStyle.cornerRadius,
            opacity: mergedStyle.opacity,
        };
    }

    /**
     * Calculate fill gradient parameters for polar shapes
     */
    getFillParams(fill: InternalAgColorType, innerRadius: number, outerRadius: number): GradientParams | undefined {
        if (!isGradientFill(fill) || fill.bounds === 'item') return;

        return {
            centerX: 0,
            centerY: 0,
            innerRadius,
            outerRadius,
        };
    }

    /**
     * Check if series has custom item stylers
     */
    hasItemStylers(): boolean {
        const { itemStyler } = this.context.properties;
        return itemStyler != null;
    }
}

/**
 * Style cache manager for performance optimization
 */
export class StyleCacheManager {
    private readonly cache = new Map<string, StyleResult>();

    /**
     * Get cached style or calculate and cache new one
     */
    getCachedStyle(key: string, calculator: () => StyleResult): StyleResult {
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const style = calculator();
        this.cache.set(key, style);
        return style;
    }

    /**
     * Clear style cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Clear cache for specific pattern
     */
    clearCachePattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
}

/**
 * Legend symbol style utilities
 */
export class LegendSymbolStyleManager {
    /**
     * Create legend symbol options from item style
     */
    static createLegendSymbolOptions(
        style: StyleResult,
        defaultProps: {
            fillOpacity?: number;
            strokeOpacity?: number;
            strokeWidth?: number;
            lineDash?: number[];
            lineDashOffset?: number;
        }
    ): any {
        let { fill } = style;
        const { stroke } = style;

        // Convert gradient fills for legend display
        if (isGradientFill(fill)) {
            fill = { ...fill, gradient: 'linear', rotation: 0, reverse: false } as InternalAgGradientColor;
        }

        return {
            marker: {
                fill,
                stroke,
                fillOpacity: defaultProps.fillOpacity,
                strokeOpacity: defaultProps.strokeOpacity,
                strokeWidth: defaultProps.strokeWidth,
                lineDash: defaultProps.lineDash,
                lineDashOffset: defaultProps.lineDashOffset,
            },
        };
    }
}

/**
 * Style merging utilities
 */
export class StyleMerger {
    /**
     * Merge base style with overrides
     */
    static mergeStyles(
        baseStyle: Partial<StyleResult>,
        ...overrides: Array<Partial<StyleResult> | undefined>
    ): StyleResult {
        return mergeDefaults(baseStyle, ...overrides.filter(Boolean));
    }

    /**
     * Merge styles with default properties
     */
    static mergeWithDefaults(style: Partial<StyleResult>, defaults: Partial<StyleResult>): StyleResult {
        return mergeDefaults(style, defaults);
    }
}

/**
 * Color utilities for polar series
 */
export class PolarColorUtils {
    /**
     * Get color from array with cycling
     */
    static getColorFromArray(colors: InternalAgColorType[], index: number): InternalAgColorType | undefined {
        if (colors.length === 0) return undefined;
        return colors[index % colors.length];
    }

    /**
     * Validate and normalize color array
     */
    static normalizeColorArray(colors: InternalAgColorType[] | undefined): InternalAgColorType[] {
        return colors && colors.length > 0 ? colors : [];
    }
}
