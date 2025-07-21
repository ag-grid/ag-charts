import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE },
} = _ModuleSupport;

export const CONE_FUNNEL_SERIES_THEME: _ModuleSupport.SeriesModule<'cone-funnel'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        fills: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                { $palette: 'secondSequentialColors' },
                _ModuleSupport.SAFE_RANGE2_OPERATION,
            ],
        },
        strokes: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                { $palette: 'secondSequentialColors' },
                _ModuleSupport.SAFE_RANGE2_OPERATION,
            ],
        },
        // @ts-expect-error undocumented option
        fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            placement: 'before',
            spacing: 4,
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
        },
        highlight: _ModuleSupport.singleSeriesHighlightStyle(false),
    },
    seriesArea: {
        padding: {
            top: 20,
            bottom: 20,
        },
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            nice: false,
            gridLine: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            line: {
                enabled: false,
            },
        },
    },
};
