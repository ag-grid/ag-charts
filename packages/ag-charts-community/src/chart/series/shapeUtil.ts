import type { AgFillType, AgGradientFillBounds, AgGradientType } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import { type GradientParams } from '../../scene/gradient/gradient';
import type { Shape } from '../../scene/shape/shape';
import { isGradientFill } from '../../scene/util/fill';

export type ShapeStyle = Partial<
    Pick<Shape, 'fill' | 'fillOpacity' | 'stroke' | 'strokeOpacity' | 'strokeWidth' | 'lineDash' | 'lineDashOffset'>
>;

export interface ShapeFillDefaults {
    gradient: AgGradientType;
    bounds: AgGradientFillBounds;
    rotation: number;
    colorStops: string[];
}

export function getShapeFill(fill: AgFillType, defaults: ShapeFillDefaults): Required<AgFillType>;
export function getShapeFill(
    fill: AgFillType | undefined,
    defaults: ShapeFillDefaults
): Required<AgFillType> | undefined;
export function getShapeFill(
    fill: AgFillType | undefined,
    defaults: ShapeFillDefaults
): Required<AgFillType> | undefined {
    if (!isGradientFill(fill)) return fill;

    return {
        ...fill,
        gradient: fill.gradient ?? defaults.gradient,
        bounds: fill.bounds ?? defaults.bounds,
        rotation: fill.rotation ?? defaults.rotation,
        colorStops: fill.colorStops ?? defaults.colorStops.map((color) => ({ color })),
    };
}

export function getShapeStyle<T extends { fill?: AgFillType }>(style: T, defaults: ShapeFillDefaults): T;
export function getShapeStyle<T extends { fill?: AgFillType }>(
    style: T | undefined,
    defaults: ShapeFillDefaults
): T | undefined;
export function getShapeStyle<T extends { fill?: AgFillType }>(
    style: T | undefined,
    defaults: ShapeFillDefaults
): T | undefined {
    if (!isGradientFill(style?.fill)) return style;
    return {
        ...style,
        fill: getShapeFill(style.fill, defaults),
    };
}

export function applyShapeStyle(
    shape: Shape,
    style: ShapeStyle,
    overrides?: ShapeStyle,
    fillBBox?: BBox,
    fillParams?: GradientParams
) {
    shape.fillBBox = fillBBox;
    shape.fillParams = fillParams;
    shape.fill = overrides?.fill ?? style.fill;
    shape.fillOpacity = overrides?.fillOpacity ?? style.fillOpacity ?? 1;
    shape.stroke = overrides?.stroke ?? style.stroke;
    shape.strokeOpacity = overrides?.strokeOpacity ?? style.strokeOpacity ?? 1;
    shape.strokeWidth = overrides?.strokeWidth ?? style.strokeWidth ?? 0;
    shape.lineDash = overrides?.lineDash ?? style.lineDash;
    shape.lineDashOffset = overrides?.lineDashOffset ?? style.lineDashOffset ?? 0;
}
