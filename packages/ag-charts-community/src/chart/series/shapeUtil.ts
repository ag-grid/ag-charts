import type { AgGradientColorBounds, AgGradientType } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import { type GradientParams } from '../../scene/gradient/gradient';
import type { Shape, ShapeColor } from '../../scene/shape/shape';
import { type InternalAgColorType, isGradientFill } from '../../scene/util/fill';

export type ShapeStyle = Partial<
    Pick<Shape, 'fill' | 'fillOpacity' | 'stroke' | 'strokeOpacity' | 'strokeWidth' | 'lineDash' | 'lineDashOffset'>
>;

export interface ShapeFillBBox {
    series: BBox;
    axis: BBox;
}

export interface ShapeFillDefaults {
    gradient: AgGradientType;
    bounds: AgGradientColorBounds;
    rotation: number;
    colorStops: string[];
}

export function getShapeFill(fill: InternalAgColorType, defaults: ShapeFillDefaults): InternalAgColorType;
export function getShapeFill(
    fill: InternalAgColorType | undefined,
    defaults: ShapeFillDefaults
): InternalAgColorType | undefined;
export function getShapeFill(
    fill: InternalAgColorType | undefined,
    defaults: ShapeFillDefaults
): InternalAgColorType | undefined {
    if (!isGradientFill(fill)) return fill;

    return {
        ...fill,
        gradient: fill.gradient ?? defaults.gradient,
        bounds: fill.bounds ?? defaults.bounds,
        rotation: fill.rotation ?? defaults.rotation,
        colorStops: fill.colorStops ?? defaults.colorStops.map((color) => ({ color })),
    };
}

export function getShapeStyle<T extends { fill?: InternalAgColorType }>(style: T, defaults: ShapeFillDefaults): T;
export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T | undefined,
    defaults: ShapeFillDefaults
): T | undefined;
export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T | undefined,
    defaults: ShapeFillDefaults
): T | undefined {
    if (!isGradientFill(style?.fill)) return style;
    return {
        ...style,
        fill: getShapeFill(style.fill, defaults),
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
