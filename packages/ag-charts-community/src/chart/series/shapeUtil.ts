import type { FillOptions, LineDashOptions, StrokeOptions } from 'ag-charts-types';

import type { Shape } from '../../scene/shape/shape';

export interface ShapeStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export function applyShapeStyle(shape: Shape, style: ShapeStyle, overrides?: ShapeStyle) {
    shape.fill = overrides?.fill ?? style.fill;
    shape.fillOpacity = overrides?.fillOpacity ?? style.fillOpacity ?? 1;
    shape.stroke = overrides?.stroke ?? style.stroke;
    shape.strokeOpacity = overrides?.strokeOpacity ?? style.strokeOpacity ?? 1;
    shape.strokeWidth = overrides?.strokeWidth ?? style.strokeWidth ?? 0;
    shape.lineDash = overrides?.lineDash ?? style.lineDash;
    shape.lineDashOffset = overrides?.lineDashOffset ?? style.lineDashOffset ?? 0;
}
