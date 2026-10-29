import {
    type OptionsDefs,
    fillOptionsDef,
    glowOptionsDefs,
    ratio,
    strokeOptionsDef,
    undocumentedDefs,
} from 'ag-charts-core';
import type { FillOptions, Opacity, StrokeOptions } from 'ag-charts-types';

export const hierarchyHighlightStyleOptionsDef: OptionsDefs<FillOptions & StrokeOptions & { opacity?: Opacity }> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    opacity: ratio,
    ...undocumentedDefs({ glow: glowOptionsDefs }),
};
