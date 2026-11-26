import {
    type OptionsDefs,
    boolean,
    borderOptionsDef,
    collisionOptionsDef,
    defined,
    deprecated,
    fillOptionsDef,
    fontOptionsDef,
    labelAutoFontSizeOptionsDefs,
    labelFitOptionsDefs,
    number,
    padding,
    positiveNumber,
    rangeLabelPlacementDef,
    string,
    strokeOptionsDef,
    undocumentedDefs,
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
    cornerRadius: positiveNumber,
    enabled: boolean,
    padding: padding,
    position: deprecated(
        union(
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
        'Use `placement` instead.'
    ),
    placement: rangeLabelPlacementDef,
    collision: collisionOptionsDef,
    rotation: number,
    text: string,
    xOffset: number,
    yOffset: number,
    ...labelFitOptionsDefs,
    ...labelAutoFontSizeOptionsDefs,
    ...undocumentedDefs({
        spacing: number,
    }),
};

export const backgroundRegionOptionsDef: OptionsDefs<AgSeriesAreaBackgroundRegion> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    xRange: backgroundRegionRangeDef,
    yRange: backgroundRegionRangeDef,
    label: backgroundRegionLabelDef,
};
