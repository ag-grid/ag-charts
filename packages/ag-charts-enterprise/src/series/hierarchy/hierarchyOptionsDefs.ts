import {
    type OptionsDefs,
    fillOptionsDef,
    glowOptionsDefs,
    ratio,
    shadowOptionsDefs,
    strokeOptionsDef,
} from 'ag-charts-core';
import type { AgGlowHighlightStyleOptions, FillOptions, Opacity, StrokeOptions } from 'ag-charts-types';

export const hierarchyHighlightStyleOptionsDef: OptionsDefs<
    FillOptions & StrokeOptions & AgGlowHighlightStyleOptions & { opacity?: Opacity }
> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    opacity: ratio,
    glow: glowOptionsDefs,
    shadow: shadowOptionsDefs,
};
