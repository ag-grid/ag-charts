import {
    type InternalAgColorType,
    type RequiredInternalAgColorType,
    type RequiredInternalAgGradientColor,
    type RequiredInternalAgImageFill,
    type RequiredInternalAgPatternColor,
    isGradientFill,
    isImageFill,
    isPatternFill,
} from 'ag-charts-core';

import type { BBox } from '../../scene/bbox';
import { type GradientParams } from '../../scene/gradient/gradient';
import type { Shape, ShapeColor } from '../../scene/shape/shape';

export type ShapeStyle = Partial<
    Pick<
        Shape,
        'fill' | 'fillOpacity' | 'stroke' | 'strokeOpacity' | 'strokeWidth' | 'lineDash' | 'lineDashOffset' | 'opacity'
    >
>;

export interface ShapeFillBBox {
    series: BBox;
    axis: BBox;
}

export function getShapeFill(
    fill: InternalAgColorType,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor,
    defaultImage: RequiredInternalAgImageFill
): RequiredInternalAgColorType;
export function getShapeFill(
    fill: InternalAgColorType | undefined,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor,
    defaultImage: RequiredInternalAgImageFill
): RequiredInternalAgColorType | undefined;
export function getShapeFill(
    fill: InternalAgColorType | undefined,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor,
    defaultImage: RequiredInternalAgImageFill
): RequiredInternalAgColorType | undefined {
    if (isGradientFill(fill)) {
        return {
            type: 'gradient',
            gradient: fill.gradient ?? defaultGradient.gradient,
            colorStops: fill.colorStops ?? defaultGradient.colorStops,
            bounds: fill.bounds ?? defaultGradient.bounds,
            rotation: fill.rotation ?? defaultGradient.rotation,
            reverse: fill.reverse ?? defaultGradient.reverse,
            colorSpace: fill.colorSpace ?? defaultGradient.colorSpace,
        };
    }

    if (isPatternFill(fill)) {
        // TODO: move this logic to theme operations
        const pattern = fill.pattern ?? defaultPattern.pattern;

        let strokeWidth = fill.strokeWidth;
        if (
            pattern === 'backward-slanted-lines' ||
            pattern === 'forward-slanted-lines' ||
            pattern === 'horizontal-lines' ||
            pattern === 'vertical-lines'
        ) {
            strokeWidth ??= defaultPattern.strokeWidth;
        } else {
            strokeWidth ??= 0;
        }

        const width = fill.width ?? fill.height ?? defaultPattern.width;
        const height = fill.height ?? fill.width ?? defaultPattern.height;

        return {
            type: 'pattern',
            pattern,
            width,
            height,
            path: fill.path,
            padding: fill.padding ?? defaultPattern.padding,
            fill: fill.fill ?? defaultPattern.fill,
            fillOpacity: fill.fillOpacity ?? defaultPattern.fillOpacity,
            backgroundFill: fill.backgroundFill ?? defaultPattern.backgroundFill,
            backgroundFillOpacity: fill.backgroundFillOpacity ?? defaultPattern.backgroundFillOpacity,
            stroke: fill.stroke ?? defaultPattern.stroke,
            strokeOpacity: fill.strokeOpacity ?? defaultPattern.strokeOpacity,
            strokeWidth,
            rotation: fill.rotation ?? defaultPattern.rotation,
            scale: fill.scale ?? defaultPattern.scale,
        };
    }

    if (isImageFill(fill)) {
        return {
            type: 'image',
            url: fill.url,
            width: fill.width,
            height: fill.height,
            backgroundFill: fill.backgroundFill ?? defaultImage.backgroundFill,
            backgroundFillOpacity: fill.backgroundFillOpacity ?? defaultImage.backgroundFillOpacity,
            rotation: fill.rotation ?? defaultImage.rotation,
            repeat: fill.repeat ?? defaultImage.repeat,
            fit: fill.fit ?? defaultImage.fit,
        };
    }

    return fill;
}

export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor,
    defaultImage: RequiredInternalAgImageFill
): T;
export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T | undefined,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor,
    defaultImage: RequiredInternalAgImageFill
): T | undefined;
export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T | undefined,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor,
    defaultImage: RequiredInternalAgImageFill
): T | undefined {
    if (!isGradientFill(style?.fill) && !isPatternFill(style?.fill) && !isImageFill(style?.fill)) return style;
    return {
        ...style,
        fill: getShapeFill(style.fill, defaultGradient, defaultPattern, defaultImage),
    };
}

export function applyShapeFillBBox(
    shape: Shape,
    fill: ShapeColor | undefined,
    fillBBox?: ShapeFillBBox,
    fillParams?: GradientParams
) {
    shape.setProperties(
        {
            fillBBox:
                fillBBox == null || !isGradientFill(fill) || fill.bounds == null || fill.bounds === 'item'
                    ? undefined
                    : fillBBox[fill.bounds],
            fillParams,
        },
        ['fillBBox', 'fillParams']
    );
}

const shapeStyleKeys = [
    'fill',
    'fillBBox',
    'fillParams',
    'fillOpacity',
    'stroke',
    'strokeOpacity',
    'strokeWidth',
    'lineDash',
    'lineDashOffset',
] as const;

export function applyShapeStyle(
    shape: Shape,
    style?: ShapeStyle,
    fillBBox?: ShapeFillBBox,
    fillParams?: GradientParams
) {
    // Opacity is managed by animation - so don't set it on the shape
    const opacity = style?.opacity ?? 1;
    const fill = style?.fill;
    shape.setProperties(
        {
            fill,
            fillBBox:
                fillBBox == null || !isGradientFill(fill) || fill.bounds == null || fill.bounds === 'item'
                    ? undefined
                    : fillBBox[fill.bounds],
            fillParams,
            fillOpacity: (style?.fillOpacity ?? 1) * opacity,
            stroke: style?.stroke,
            strokeOpacity: (style?.strokeOpacity ?? 1) * opacity,
            strokeWidth: style?.strokeWidth ?? 0,
            lineDash: style?.lineDash,
            lineDashOffset: style?.lineDashOffset ?? 0,
        },
        shapeStyleKeys
    );
}
