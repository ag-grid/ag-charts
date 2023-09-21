import { themes as themeFactories } from './chart/mapping/themes';
import type { ChartTheme as ChartThemeType } from './chart/themes/chartTheme';

export { getChartTheme } from './chart/mapping/themes';
export { ChartTheme } from './chart/themes/chartTheme';
export * from './chart/themes/symbols';
export * from './chart/themes/constants';

export const themes = Object.entries(themeFactories).reduce((obj, [name, factory]) => {
    obj[name as keyof typeof themeFactories] = factory();
    return obj;
}, {} as Record<keyof typeof themeFactories, ChartThemeType>);
