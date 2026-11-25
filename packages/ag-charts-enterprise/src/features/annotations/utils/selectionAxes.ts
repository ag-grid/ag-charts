import type { AgAnnotationAxisOptions, AgAnnotationsOptions } from 'ag-charts-types';

import {
    type SelectionAxesStyles,
    type SelectionAxisLabelStyles,
    type SelectionAxisShadingStyles,
    type SelectionAxisStyles,
    createAxisLabelDatum,
} from '../annotationDatum';

function resolveAxis(
    { axisLabel }: Pick<AgAnnotationsOptions, 'axisLabel'>,
    axis: AgAnnotationAxisOptions | undefined
): SelectionAxisStyles {
    // The options have been through the theme by now, so they hold no colour references, which the types allow.
    const label = { ...createAxisLabelDatum(), ...axisLabel, ...axis?.axisLabel } as SelectionAxisLabelStyles;
    const shading = { ...axis?.axisShading } as SelectionAxisShadingStyles;
    return {
        axisLabel: { ...label, visible: label.visible ?? 'selected' },
        axisShading: { ...shading, visible: shading.visible ?? 'selected' },
    };
}

/**
 * The labels and shading that annotations show on each axis: the `axisLabel` that is set for both, overridden by the
 * options of the axis. Horizontal and vertical lines have axis labels of their own, which these do not apply to.
 */
export function resolveSelectionAxes(options: AgAnnotationsOptions | undefined): SelectionAxesStyles {
    const { xAxis, yAxis } = options ?? {};
    return { x: resolveAxis(options ?? {}, xAxis), y: resolveAxis(options ?? {}, yAxis) };
}
