import { ChartTheme, getChartTheme, resolveOperation, themeNames, themes } from './integrated-charts-theme';
import type * as ThemeExports from './integrated-charts-theme';

// Plain object rather than an `export * as` namespace, so bundlers drop it when Integrated Charts is unused.
export const _Theme: typeof ThemeExports = { ChartTheme, getChartTheme, resolveOperation, themeNames, themes };
