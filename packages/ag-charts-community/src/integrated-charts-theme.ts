import { themes as themeFactories } from './chart/mapping/themes';
import { mapValues } from './util/object';

export { getChartTheme } from './chart/mapping/themes';
export { ChartTheme } from './chart/themes/chartTheme';
export * from './chart/themes/symbols';
export * from './chart/themes/constants';
export * from './module/theme';

export const themes = mapValues(themeFactories, (themeFactory) => themeFactory?.());
