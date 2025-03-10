import { type Operation, _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { POLAR_AXIS_TYPE, POLAR_AXIS_SHAPE },
} = _ModuleSupport;

const axisShape: Operation = {
    $path: ['./shape', POLAR_AXIS_SHAPE.CIRCLE, { $find: [{ $not: [{ $isOperation: './shape' }] }, { $path: '..' }] }],
};

export const NIGHTINGALE_SERIES_THEME: _ModuleSupport.SeriesModule<'nightingale'>['themeTemplate'] = {
    series: {
        fill: { $palette: 'fill' },
        stroke: {
            $if: [{ $eq: [{ $palette: 'type' }, 'inbuilt'] }, { $ref: 'backgroundColor' }, { $palette: 'stroke' }],
        },
        // @ts-expect-error undocumented option
        defaultColorRange: { $palette: 'gradient' },
        strokeWidth: 1,
        label: {
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
    },
    axes: {
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            shape: axisShape,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                spacing: 10,
            },
        },
        [POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
            shape: axisShape,
        },
    },
};
