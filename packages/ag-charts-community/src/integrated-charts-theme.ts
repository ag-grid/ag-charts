import { themes as themeFactories } from './chart/mapping/themes';

export { getChartTheme } from './chart/mapping/themes';
export { ChartTheme } from './chart/themes/chartTheme';
export * from './chart/themes/symbols';
export * from './chart/themes/constants';
export * from './chart/themes/util';
export * from './module/theme';

export const themes = Object.freeze(themeFactories);
