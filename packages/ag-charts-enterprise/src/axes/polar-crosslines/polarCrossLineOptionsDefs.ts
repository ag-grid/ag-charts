import {
    type OptionsContribution,
    type OptionsDefs,
    type Validator,
    commonCrossLineLabelOptionsDefs,
    crossLineThemeOptionsDefs,
    crossLinesArrayOptionsDefs,
    crossLinesThemeTemplate,
    number,
} from 'ag-charts-core';
import type { AgBaseCrossLineLabelOptions, AgRadiusCrossLineLabelOptions } from 'ag-charts-types';

const radiusCrossLineLabelOptionsDefs: OptionsDefs<AgRadiusCrossLineLabelOptions> = {
    ...commonCrossLineLabelOptionsDefs,
    positionAngle: number,
};

export function angleCrossLines(axisType: string, value: Validator): OptionsContribution {
    return polarCrossLines(axisType, value, commonCrossLineLabelOptionsDefs);
}

export function radiusCrossLines(axisType: string, value: Validator): OptionsContribution {
    return polarCrossLines(axisType, value, radiusCrossLineLabelOptionsDefs);
}

function polarCrossLines(
    axisType: string,
    value: Validator,
    labelDefs: OptionsDefs<AgBaseCrossLineLabelOptions>
): OptionsContribution {
    return {
        path: 'axes[].crossLines',
        axisTypes: [axisType],
        options: crossLinesArrayOptionsDefs(value, labelDefs),
        themeOptions: crossLineThemeOptionsDefs(labelDefs),
        themeTemplate: crossLinesThemeTemplate,
    };
}
