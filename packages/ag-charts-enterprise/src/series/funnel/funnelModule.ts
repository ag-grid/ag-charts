import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { FunnelSeries } from './funnelSeries';
import { FUNNEL_SERIES_THEME } from './funnelThemes';

export const FunnelModule: _ModuleSupport.SeriesModule<'funnel'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'funnel',
    moduleFactory: (ctx) => new FunnelSeries(ctx),
    solo: true,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: (series) => {
        const { placement, ...categoryLabel } = series?.stageLabel ?? {};
        return series?.direction !== 'vertical'
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
    },
    themeTemplate: FUNNEL_SERIES_THEME,

    paletteFactory: ({ takeColors }) => {
        const { fills, strokes } = takeColors(1);
        return { fills, strokes };
    },
};
