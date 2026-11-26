import {
    type OptionsDefs,
    collisionOptionsDef,
    commonCrossLineLabelOptionsDefs,
    labelAutoFontSizeOptionsDefs,
    labelFitOptionsDefs,
    number,
    rangeLabelPlacementDef,
} from 'ag-charts-core';
import type { AgCartesianCrossLineLabelOptions } from 'ag-charts-types';

export const cartesianCrossLineLabelOptionsDefs: OptionsDefs<AgCartesianCrossLineLabelOptions> = {
    ...commonCrossLineLabelOptionsDefs,
    // Which values apply depends on the cross line's type and axis, so they are checked when it is laid out.
    placement: rangeLabelPlacementDef,
    rotation: number,
    collision: collisionOptionsDef,
    ...labelFitOptionsDefs,
    ...labelAutoFontSizeOptionsDefs,
};
