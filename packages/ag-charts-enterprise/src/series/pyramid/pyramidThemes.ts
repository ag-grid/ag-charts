import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeSymbols: { DEFAULT_SHADOW_COLOUR },
} = _ModuleSupport;

export const PYRAMID_SERIES_THEME: _ModuleSupport.SeriesModule<'pyramid'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        spacing: 2,
        fills: { $palette: 'fills' },
        strokes: { $palette: 'strokes' },
        // @ts-expect-error undocumented option
        fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
        },
        stageLabel: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            spacing: 12,
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        highlight: _ModuleSupport.singleSeriesHighlightStyle(),
    },
};
