import type { InternalAgColorType, InternalAgGradientColor, InternalAgPatternColor } from 'ag-charts-core';

import type { BBox } from '../../scene/bbox';
import { ConicGradient } from '../../scene/gradient/conicGradient';
import { Gradient, type GradientParams } from '../../scene/gradient/gradient';
import { LinearGradient } from '../../scene/gradient/linearGradient';
import { RadialGradient } from '../../scene/gradient/radialGradient';
import { getColorStops } from '../../scene/gradient/stops';
import { Pattern } from '../../scene/pattern/pattern';
import type { Shape, ShapeColor } from '../../scene/shape/shape';
import { isGradientFill, isPatternFill } from '../../scene/util/fill';

export type ShapeStyle = Partial<
    Pick<Shape, 'fill' | 'fillOpacity' | 'stroke' | 'strokeOpacity' | 'strokeWidth' | 'lineDash' | 'lineDashOffset'>
>;

export interface ShapeFillBBox {
    series: BBox;
    axis: BBox;
}

export function getShapeFill2(fill: InternalAgColorType, fillBBox?: ShapeFillBBox): Gradient | Pattern | string;
export function getShapeFill2(
    fill: InternalAgColorType | undefined,
    fillBBox?: ShapeFillBBox
): Gradient | Pattern | string | undefined;
export function getShapeFill2(
    fill: InternalAgColorType | undefined,
    fillBBox?: ShapeFillBBox
): Gradient | Pattern | string | undefined {
    if (isGradientFill(fill)) {
        const { gradient = 'linear', colorStops = ['black'], bounds = 'item', rotation = 0, reverse = false } = fill;

        let stops = getColorStops(colorStops, ['black'], [0, 1]);
        if (reverse) {
            stops = stops.map((s) => ({ color: s.color, stop: 1 - s.stop })).reverse();
        }

        const bbox = bounds === 'item' ? undefined : fillBBox?.[bounds];

        switch (gradient) {
            case 'linear':
                return new LinearGradient('rgb', stops, rotation, bbox);
            case 'radial':
                return new RadialGradient('rgb', stops);
            case 'conic':
                return new ConicGradient('rgb', stops, rotation);
        }
    } else if (isPatternFill(fill)) {
        return new Pattern(fill);
    } else {
        return fill;
    }
}

export function getShapeFill(
    fill: InternalAgColorType,
    defaultGradient: Required<InternalAgGradientColor>,
    defaultPattern: Required<InternalAgPatternColor>
): Required<InternalAgColorType>;
export function getShapeFill(
    fill: InternalAgColorType | undefined,
    defaultGradient: Required<InternalAgGradientColor>,
    defaultPattern: Required<InternalAgPatternColor>
): Required<InternalAgColorType> | undefined;
export function getShapeFill(
    fill: InternalAgColorType | undefined,
    defaultGradient: Required<InternalAgGradientColor>,
    defaultPattern: Required<InternalAgPatternColor>
): Required<InternalAgColorType> | undefined {
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
            padding: fill.padding ?? defaultPattern.padding,
            fill: fill.fill ?? defaultPattern.fill,
            fillOpacity: fill.fillOpacity ?? defaultPattern.fillOpacity,
            backgroundFill: fill.backgroundFill ?? defaultPattern.backgroundFill,
            backgroundFillOpacity: fill.backgroundFillOpacity ?? defaultPattern.backgroundFillOpacity,
            stroke: fill.stroke ?? defaultPattern.stroke,
            strokeOpacity: fill.strokeOpacity ?? defaultPattern.strokeOpacity,
            strokeWidth,
            rotation: fill.rotation ?? defaultPattern.rotation,
        };
    }

    return fill as any;
}

export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T,
    defaultGradient: Required<InternalAgGradientColor>,
    defaultPattern: Required<InternalAgPatternColor>
): T;
export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T | undefined,
    defaultGradient: Required<InternalAgGradientColor>,
    defaultPattern: Required<InternalAgPatternColor>
): T | undefined;
export function getShapeStyle<T extends { fill?: InternalAgColorType }>(
    style: T | undefined,
    defaultGradient: Required<InternalAgGradientColor>,
    defaultPattern: Required<InternalAgPatternColor>
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
