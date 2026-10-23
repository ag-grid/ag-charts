import {
    type OptionsContribution,
    type OptionsDefs,
    type Validator,
    commonCrossLineLabelOptionsDefs,
    crossLinesContribution,
    number,
} from 'ag-charts-core';
import type { AgRadiusCrossLineLabelOptions } from 'ag-charts-types';

const radiusCrossLineLabelOptionsDefs: OptionsDefs<AgRadiusCrossLineLabelOptions> = {
    ...commonCrossLineLabelOptionsDefs,
    positionAngle: number,
};

export function angleCrossLines(axisType: string, value: Validator): OptionsContribution {
    return crossLinesContribution([axisType], value, commonCrossLineLabelOptionsDefs);
}

export function radiusCrossLines(axisType: string, value: Validator): OptionsContribution {
    return crossLinesContribution([axisType], value, radiusCrossLineLabelOptionsDefs);
}
