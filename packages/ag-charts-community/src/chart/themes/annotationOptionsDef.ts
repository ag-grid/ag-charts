import {
    type OptionsDefs,
    array,
    arrayOf,
    arrayOfDefs,
    boolean,
    color,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    optionsDefs,
    or,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    toolbarButtonOptionsDefs,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgAnnotationAxisLabel,
    AgAnnotationHandleStyles,
    AgAnnotationOptionsToolbarButton,
    AgAnnotationOptionsToolbarSwitch,
    AgAnnotationsOptions,
    AgAnnotationsToolbarButton,
    AgCalloutAnnotationStyles,
    AgChannelAnnotationMiddle,
    AgChannelAnnotationStyles,
    AgChannelAnnotationTextStyles,
    AgCommentAnnotationStyles,
    AgCrossLineAnnotationStyles,
    AgDisjointChannelAnnotationStyles,
    AgFibonacciAnnotationStyles,
    AgLineAnnotationStyles,
    AgLineAnnotationTextStyles,
    AgMeasurerAnnotationStatistics,
    AgMeasurerAnnotationStyles,
    AgNoteAnnotationStyles,
    AgParallelChannelAnnotationStyles,
    AgQuickMeasurerAnnotationDirectionStyles,
    AgQuickMeasurerAnnotationStyles,
    AgShapeAnnotationStyles,
    AgTextAnnotationStyles,
    LineOptions,
} from 'ag-charts-types';

const annotationLineOptionsDef: OptionsDefs<LineOptions> = {
    lineStyle: union('solid', 'dashed', 'dotted'),
    ...lineDashOptionsDef,
};

const annotationHandleStylesDefs: OptionsDefs<AgAnnotationHandleStyles> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const annotationTextStylesDef: OptionsDefs<AgTextAnnotationStyles> = {
    visible: boolean,
    locked: boolean,
    readOnly: boolean,
    handle: annotationHandleStylesDefs,
    ...fontOptionsDef,
};

export const annotationLineTextDefs: OptionsDefs<AgLineAnnotationTextStyles> = {
    position: union('top', 'center', 'bottom'),
    alignment: union('left', 'center', 'right'),
    ...fontOptionsDef,
};

export const annotationChannelTextDefs: OptionsDefs<AgChannelAnnotationTextStyles> = {
    position: union('top', 'inside', 'bottom'),
    alignment: union('left', 'center', 'right'),
    ...fontOptionsDef,
};

const annotationAxisLabelOptionsDef: OptionsDefs<AgAnnotationAxisLabel> = {
    enabled: boolean,
    cornerRadius: positiveNumber,
    ...fontOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const annotationChannelMiddleDefs: OptionsDefs<AgChannelAnnotationMiddle> = {
    visible: boolean,
    ...annotationLineOptionsDef,
    ...strokeOptionsDef,
};

const annotationMeasurerStatisticsOptionsDefs: OptionsDefs<AgMeasurerAnnotationStatistics> = {
    divider: strokeOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...fontOptionsDef,
};

const annotationQuickMeasurerDirectionStylesDefs: OptionsDefs<AgQuickMeasurerAnnotationDirectionStyles> = {
    handle: annotationHandleStylesDefs,
    statistics: annotationMeasurerStatisticsOptionsDefs,
    ...annotationLineOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
};

export const annotationLineStyleDefs: OptionsDefs<AgLineAnnotationStyles> = {
    visible: boolean,
    locked: boolean,
    readOnly: boolean,
    extendStart: boolean,
    extendEnd: boolean,
    handle: annotationHandleStylesDefs,
    text: annotationLineTextDefs,
    ...annotationLineOptionsDef,
    ...strokeOptionsDef,
};

export const annotationCrossLineStyleDefs: OptionsDefs<AgCrossLineAnnotationStyles> = {
    visible: boolean,
    locked: boolean,
    readOnly: boolean,
    axisLabel: annotationAxisLabelOptionsDef,
    handle: annotationHandleStylesDefs,
    text: annotationLineTextDefs,
    ...annotationLineOptionsDef,
    ...strokeOptionsDef,
};

export const annotationChannelStyleDefs: OptionsDefs<AgChannelAnnotationStyles> = {
    visible: boolean,
    locked: boolean,
    readOnly: boolean,
    extendStart: boolean,
    extendEnd: boolean,
    handle: annotationHandleStylesDefs,
    text: annotationChannelTextDefs,
    background: fillOptionsDef,
    ...annotationLineOptionsDef,
    ...strokeOptionsDef,
};

export const annotationDisjointChannelStyleDefs: OptionsDefs<AgDisjointChannelAnnotationStyles> = {
    ...annotationChannelStyleDefs,
};

export const annotationParallelChannelStyleDefs: OptionsDefs<AgParallelChannelAnnotationStyles> = {
    ...annotationChannelStyleDefs,
    middle: annotationChannelMiddleDefs,
};

export const annotationFibonacciStylesDefs: OptionsDefs<AgFibonacciAnnotationStyles> = {
    label: fontOptionsDef,
    showFill: boolean,
    isMultiColor: boolean,
    strokes: arrayOf(color),
    rangeStroke: color,
    bands: union(4, 6, 10),
    ...annotationLineStyleDefs,
};

export const annotationCalloutStylesDefs: OptionsDefs<AgCalloutAnnotationStyles> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...annotationTextStylesDef,
};

export const annotationCommentStylesDefs: OptionsDefs<AgCommentAnnotationStyles> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...annotationTextStylesDef,
};

export const annotationNoteStylesDefs: OptionsDefs<AgNoteAnnotationStyles> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...annotationTextStylesDef,
    background: {
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
};

export const annotationShapeStylesDefs: OptionsDefs<AgShapeAnnotationStyles> = {
    visible: boolean,
    locked: boolean,
    readOnly: boolean,
    handle: annotationHandleStylesDefs,
    ...fillOptionsDef,
};

export const annotationMeasurerStylesDefs: OptionsDefs<AgMeasurerAnnotationStyles> = {
    visible: boolean,
    locked: boolean,
    readOnly: boolean,
    extendStart: boolean,
    extendEnd: boolean,
    handle: annotationHandleStylesDefs,
    text: annotationLineTextDefs,
    background: fillOptionsDef,
    statistics: annotationMeasurerStatisticsOptionsDefs,
    ...annotationLineOptionsDef,
    ...strokeOptionsDef,
};

export const annotationQuickMeasurerStylesDefs: OptionsDefs<AgQuickMeasurerAnnotationStyles> = {
    visible: boolean,
    up: annotationQuickMeasurerDirectionStylesDefs,
    down: annotationQuickMeasurerDirectionStylesDefs,
};

export const annotationOptionsDef: OptionsDefs<AgAnnotationsOptions> = {
    enabled: boolean,
    axesButtons: {
        enabled: boolean,
        axes: union('x', 'y', 'xy'),
    },
    toolbar: {
        enabled: boolean,
        padding: positiveNumber,
        buttons: arrayOfDefs<AgAnnotationsToolbarButton>(
            {
                ...toolbarButtonOptionsDefs,
                value: union(
                    'line-menu',
                    'fibonacci-menu',
                    'text-menu',
                    'shape-menu',
                    'measurer-menu',
                    'line',
                    'horizontal-line',
                    'vertical-line',
                    'parallel-channel',
                    'disjoint-channel',
                    'fibonacci-retracement',
                    'fibonacci-retracement-trend-based',
                    'text',
                    'comment',
                    'callout',
                    'note',
                    'clear'
                ),
            },
            'annotation toolbar buttons array'
        ),
    },
    optionsToolbar: {
        enabled: boolean,
        buttons: arrayOf(
            or(
                optionsDefs<AgAnnotationOptionsToolbarButton>({
                    ...toolbarButtonOptionsDefs,
                    value: required(
                        union(
                            'line-stroke-width',
                            'line-style-type',
                            'line-color',
                            'fill-color',
                            'text-color',
                            'text-size',
                            'delete',
                            'settings'
                        )
                    ),
                }),
                optionsDefs<AgAnnotationOptionsToolbarSwitch>({
                    ...toolbarButtonOptionsDefs,
                    value: required(union('lock')),
                    checkedOverrides: toolbarButtonOptionsDefs,
                })
            )
        ),
    },
};

// @ts-expect-error undocumented option
annotationOptionsDef.data = undocumented(array);
// @ts-expect-error undocumented option
annotationOptionsDef.xKey = undocumented(string);
// @ts-expect-error undocumented option
annotationOptionsDef.volumeKey = undocumented(string);
// @ts-expect-error undocumented option
annotationOptionsDef.snap = undocumented(boolean);
