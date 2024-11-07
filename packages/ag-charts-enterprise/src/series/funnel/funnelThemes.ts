import {
    type AgCategoryAxisThemeOptions,
    type AgFunnelSeriesOptions,
    type AgFunnelSeriesThemeableOptions,
    type AgNumberAxisThemeOptions,
    _ModuleSupport,
} from 'ag-charts-community';

const {
    ThemeSymbols: { DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_FONT_FAMILY },
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
} = _ModuleSupport;

export function funnelSeriesAxes(series: Pick<AgFunnelSeriesOptions, 'direction' | 'stageLabel'>) {
    const { placement, ...categoryLabel } = series?.stageLabel ?? {};
    return series?.direction !== 'horizontal'
        ? [
              {
                  type: CARTESIAN_AXIS_TYPE.CATEGORY,
                  position: placement === 'after' ? CARTESIAN_POSITION.RIGHT : CARTESIAN_POSITION.LEFT,
                  label: categoryLabel,
              },
              {
                  type: CARTESIAN_AXIS_TYPE.NUMBER,
                  position: CARTESIAN_POSITION.BOTTOM,
              },
          ]
        : [
              {
                  type: CARTESIAN_AXIS_TYPE.NUMBER,
                  position: CARTESIAN_POSITION.LEFT,
              },
              {
                  type: CARTESIAN_AXIS_TYPE.CATEGORY,
                  position: placement === 'before' ? CARTESIAN_POSITION.TOP : CARTESIAN_POSITION.BOTTOM,
                  label: categoryLabel,
              },
          ];
}

export const FUNNEL_SERIES_THEME: {
    series: AgFunnelSeriesThemeableOptions;
    axes: { number: AgNumberAxisThemeOptions; category: AgCategoryAxisThemeOptions };
} = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        spacingRatio: 0.25,
        label: {
            enabled: true,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        },
        dropOff: {
            enabled: true,
            fillOpacity: 0.2,
            strokeWidth: 0,
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
                formatter(params) {
                    return Math.abs(params.value).toFixed(params.fractionDigits ?? 0);
                },
            },
        },
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            line: {
                enabled: false,
            },
        },
    },
};
