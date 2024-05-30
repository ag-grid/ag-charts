import { themesMap } from './chart/mapping/themes';
import type { ChartTheme } from './chart/themes/chartTheme';
import type { AgChartThemeName } from './options/chart/themeOptions';

export { getChartTheme } from './chart/mapping/themes';
export { ChartTheme } from './chart/themes/chartTheme';
export * from './chart/themes/symbols';
export * from './chart/themes/constants';
export * from './module/theme';

export const themes = createThemesRecord();

function createThemesRecord() {
    const themesRecord = {} as Record<AgChartThemeName, ChartTheme>;
    for (const [themeName, themeFactory] of themesMap) {
        themesRecord[themeName] = themeFactory();
    }
    return themesRecord;
}
