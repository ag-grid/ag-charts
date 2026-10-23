import {
    type CrossLinesAxisType,
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

export function angleCrossLines(axisType: CrossLinesAxisType, value: Validator): OptionsContribution {
    return crossLinesContribution([axisType], value, commonCrossLineLabelOptionsDefs);
}

export function radiusCrossLines(axisType: CrossLinesAxisType, value: Validator): OptionsContribution {
    return crossLinesContribution([axisType], value, radiusCrossLineLabelOptionsDefs);
}
