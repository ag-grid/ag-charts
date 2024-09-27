import {
    type AgCategoryAxisThemeOptions,
    type AgFunnelSeriesOptions,
    type AgFunnelSeriesThemeableOptions,
    type AgNumberAxisThemeOptions,
    _Theme,
} from 'ag-charts-community';

export function funnelSeriesAxes(series: Pick<AgFunnelSeriesOptions, 'direction' | 'stageLabel'>) {
    const { placement, ...categoryLabel } = series?.stageLabel ?? {};
    return series?.direction !== 'horizontal'
        ? [
              {
                  type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
                  position: placement === 'after' ? _Theme.POSITION.RIGHT : _Theme.POSITION.LEFT,
                  label: categoryLabel,
              },
              {
                  type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER,
                  position: _Theme.POSITION.BOTTOM,
              },
          ]
        : [
              {
                  type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER,
                  position: _Theme.POSITION.LEFT,
              },
              {
                  type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
                  position: placement === 'before' ? _Theme.POSITION.TOP : _Theme.POSITION.BOTTOM,
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
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        },
        dropOff: {
            enabled: true,
            fillOpacity: 0.2,
            strokeWidth: 0,
        },
    },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
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
        [_Theme.CARTESIAN_AXIS_TYPE.CATEGORY]: {
            line: {
                enabled: false,
            },
        },
    },
};
