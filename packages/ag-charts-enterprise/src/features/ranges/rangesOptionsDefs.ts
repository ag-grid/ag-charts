import {
    type AgRangesButton,
    type AgRangesButtonStyles,
    type AgRangesDropdown,
    type AgRangesOptions,
    type AgRangesStateStyles,
    type AgRangesStyles,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    boolean,
    callback,
    color,
    date,
    fillCssOptionsDef,
    fontOptionsDef,
    number,
    or,
    padding,
    positiveNumber,
    strokeOptionsDef,
    timeInterval,
    timeIntervalUnit,
    toolbarButtonOptionsDefs,
    undocumented,
    union,
} from 'ag-charts-core';

const stateStylesOptions: OptionsDefs<AgRangesStateStyles> = {
    ...fillCssOptionsDef,
    stroke: strokeOptionsDef.stroke,
    textColor: color,
};

const stylesOptions: OptionsDefs<AgRangesStyles> = {
    ...fillCssOptionsDef,
    ...strokeOptionsDef,
    ...fontOptionsDef,
    textColor: color,
    cornerRadius: positiveNumber,
    padding: padding,
    active: stateStylesOptions,
    disabled: stateStylesOptions,
    hover: stateStylesOptions,
};

const dropdownOptions: OptionsDefs<AgRangesDropdown> = {
    ...stylesOptions,
    visible: union('auto', 'always', 'never'),
};

const buttonStylesOptions: OptionsDefs<AgRangesButtonStyles> = {
    ...stylesOptions,
};

export const rangesOptionsDefs: OptionsDefs<AgRangesOptions> = {
    enabled: boolean,
    enableOutOfRange: boolean,
    position: union('top-left', 'top', 'top-right', 'bottom-left', 'bottom', 'bottom-right'),
    button: buttonStylesOptions,
    dropdown: dropdownOptions,
    gap: positiveNumber,
    spacing: positiveNumber,
    ...stylesOptions,
    buttons: arrayOfDefs<AgRangesButton>(
        {
            ...toolbarButtonOptionsDefs,
            enabled: boolean,
            value: or(
                number,
                and(arrayOf(or(number, date)), arrayLength(2, 2)),
                timeInterval,
                timeIntervalUnit,
                callback
            ),
        },
        'range button options array'
    ),
};

// @ts-expect-error undocumented option
rangesOptionsDefs.minSize = undocumented(positiveNumber);
