import {
    type OptionsDefs,
    boolean,
    borderOptionsDef,
    defined,
    fillOptionsDef,
    fontOptionsDef,
    labelAutoFontSizeOptionsDefs,
    labelFitOptionsDefs,
    number,
    padding,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type {
    AgSeriesAreaBackgroundRegion,
    AgSeriesAreaBackgroundRegionLabel,
    AgSeriesAreaBackgroundRegionRange,
} from 'ag-charts-types';

const backgroundRegionRangeDef: OptionsDefs<AgSeriesAreaBackgroundRegionRange> = {
    axis: string,
    start: defined,
    end: defined,
};

const backgroundRegionLabelDef: OptionsDefs<AgSeriesAreaBackgroundRegionLabel> = {
    ...fontOptionsDef,
    ...fillOptionsDef,
    border: borderOptionsDef,
    cornerRadius: number,
    enabled: boolean,
    padding: padding,
    position: union(
        'top',
        'left',
        'right',
        'bottom',
        'left-top',
        'right-top',
        'left-bottom',
        'right-bottom',
        'inside',
        'inside-left',
        'inside-right',
        'inside-top',
        'inside-bottom',
        'inside-top-left',
        'inside-bottom-left',
        'inside-top-right',
        'inside-bottom-right',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right'
    ),
    rotation: number,
    text: string,
    xOffset: number,
    yOffset: number,
    ...labelFitOptionsDefs,
    ...labelAutoFontSizeOptionsDefs,
};

export const backgroundRegionOptionsDef: OptionsDefs<AgSeriesAreaBackgroundRegion> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    xRange: backgroundRegionRangeDef,
    yRange: backgroundRegionRangeDef,
    label: backgroundRegionLabelDef,
};
