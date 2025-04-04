import type {
    InternalAgColorType,
    RequiredInternalAgColorType,
    RequiredInternalAgGradientColor,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';

import type { BBox } from '../../scene/bbox';
import { type GradientParams } from '../../scene/gradient/gradient';
import type { Shape, ShapeColor } from '../../scene/shape/shape';
import { isGradientFill, isPatternFill } from '../../scene/util/fill';

export type ShapeStyle = Partial<
    Pick<Shape, 'fill' | 'fillOpacity' | 'stroke' | 'strokeOpacity' | 'strokeWidth' | 'lineDash' | 'lineDashOffset'>
>;

export interface ShapeFillBBox {
    series: BBox;
    axis: BBox;
}

export function getShapeFill(
    fill: InternalAgColorType,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor
): RequiredInternalAgColorType;
export function getShapeFill(
    fill: InternalAgColorType | undefined,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor
): RequiredInternalAgColorType | undefined;
export function getShapeFill(
    fill: InternalAgColorType | undefined,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor
): RequiredInternalAgColorType | undefined {
    if (isGradientFill(fill)) {
        return {
            type: 'gradient',
            gradient: fill.gradient ?? defaultGradient.gradient,
            colorStops: fill.colorStops ?? defaultGradient.colorStops,
            bounds: fill.bounds ?? defaultGradient.bounds,
            rotation: fill.rotation ?? defaultGradient.rotation,
            reverse: fill.reverse ?? defaultGradient.reverse,
        };
    }

    if (isPatternFill(fill) && defaultPattern) {
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
            image: fill.image,
            repetition: fill.repetition ?? 'repeat',
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
            imageFit: fill.imageFit ?? defaultPattern.imageFit,
        };
    }

    return fill as any;
}

export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor
): T;
export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T | undefined,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor
): T | undefined;
export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T | undefined,
    defaultGradient: RequiredInternalAgGradientColor,
    defaultPattern: RequiredInternalAgPatternColor
): T | undefined {
    if (!isGradientFill(style?.fill) && !isPatternFill(style?.fill)) return style;
    return {
        ...style,
        fill: getShapeFill(style.fill, defaultGradient, defaultPattern),
    };
}

export function applyShapeFillBBox(
    shape: Shape,
    fill: ShapeColor | undefined,
    fillBBox?: ShapeFillBBox,
    fillParams?: GradientParams
) {
    if (fillBBox == null || !isGradientFill(fill) || fill.bounds == null || fill.bounds === 'item') {
        shape.fillBBox = undefined;
    } else {
        shape.fillBBox = fillBBox[fill.bounds];
    }
    shape.fillParams = fillParams;
}

export function applyShapeStyle(
    shape: Shape,
    style: ShapeStyle,
    overrides?: ShapeStyle,
    fillBBox?: ShapeFillBBox,
    fillParams?: GradientParams
) {
    const fill = overrides?.fill ?? style.fill;
    shape.fill = fill;
    applyShapeFillBBox(shape, overrides?.fill ?? style.fill, fillBBox, fillParams);
    shape.fillOpacity = overrides?.fillOpacity ?? style.fillOpacity ?? 1;
    shape.stroke = overrides?.stroke ?? style.stroke;
    shape.strokeOpacity = overrides?.strokeOpacity ?? style.strokeOpacity ?? 1;
    shape.strokeWidth = overrides?.strokeWidth ?? style.strokeWidth ?? 0;
    shape.lineDash = overrides?.lineDash ?? style.lineDash;
    shape.lineDashOffset = overrides?.lineDashOffset ?? style.lineDashOffset ?? 0;
}
