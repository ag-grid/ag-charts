import {
    type OptionsDefs,
    boolean,
    fillOptionsDef,
    lineDashOptionsDef,
    positiveNumber,
    ratio,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type {
    AgScrollbarBaseOptions,
    AgScrollbarHorizontalOrientationOptions,
    AgScrollbarOptions,
    AgScrollbarVerticalOrientationOptions,
} from 'ag-charts-types';

const scrollbarTrackOptionsDef = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
    opacity: ratio,
};

const scrollbarThumbOptionsDef = {
    ...scrollbarTrackOptionsDef,
    minSize: positiveNumber,
    hoverStyle: {
        fill: fillOptionsDef.fill,
        stroke: strokeOptionsDef.stroke,
    },
};

const scrollbarBaseOptionsDef: OptionsDefs<AgScrollbarBaseOptions> = {
    enabled: boolean,
    thickness: positiveNumber,
    spacing: positiveNumber,
    tickSpacing: positiveNumber,
    visible: union('auto', 'always', 'never'),
    placement: union('outer', 'inner'),
    track: scrollbarTrackOptionsDef,
    thumb: scrollbarThumbOptionsDef,
};

const scrollbarHorizontalOrientationOptionsDef: OptionsDefs<AgScrollbarHorizontalOrientationOptions> = {
    ...scrollbarBaseOptionsDef,
    position: union('top', 'bottom'),
};

const scrollbarVerticalOrientationOptionsDef: OptionsDefs<AgScrollbarVerticalOrientationOptions> = {
    ...scrollbarBaseOptionsDef,
    position: union('left', 'right'),
};

export const scrollbarOptionsDef: OptionsDefs<AgScrollbarOptions> = {
    enabled: boolean,
    enableAxisScrolling: boolean,
    enableSeriesAreaScrolling: boolean,
    thickness: positiveNumber,
    spacing: positiveNumber,
    tickSpacing: positiveNumber,
    visible: union('auto', 'always', 'never'),
    placement: union('outer', 'inner'),
    track: scrollbarTrackOptionsDef,
    thumb: scrollbarThumbOptionsDef,
    horizontal: scrollbarHorizontalOrientationOptionsDef,
    vertical: scrollbarVerticalOrientationOptionsDef,
};
