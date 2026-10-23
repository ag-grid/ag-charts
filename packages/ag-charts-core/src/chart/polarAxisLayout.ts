/**
 * Polar-axis layout snapshot. Defined only on polar axes (`AngleAxis` / `RadiusAxis`) via
 * {@link AxisContext.getPolarLayout}; cartesian axes leave it undefined. Describes the polar
 * axis's own layout — generic axis state, not specific to any one plugin. `ticks` is populated
 * for angle axes; `gridAngles` for radius axes.
 */
export interface PolarAxisLayout {
    rotation: number;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    shape: 'polygon' | 'circle';
    axisOuterRadius: number;
    axisInnerRadius: number;
    ticks?: unknown[];
    gridAngles?: number[];
}
