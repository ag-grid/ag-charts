import { themes as themeFactories } from './chart/mapping/themes';
import type { ChartTheme as ChartThemeType } from './chart/themes/chartTheme';

export { getChartTheme } from './chart/mapping/themes';
export { ChartTheme } from './chart/themes/chartTheme';
export {
    EXTENDS_AXES_DEFAULTS,
    EXTENDS_AXES_LABEL_DEFAULTS,
    EXTENDS_AXES_LINE_DEFAULTS,
    EXTENDS_AXES_TICK_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
    OVERRIDE_SERIES_LABEL_DEFAULTS,
    DEFAULT_FONT_FAMILY,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    DEFAULT_SHADOW_COLOUR,
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
} from './chart/themes/symbols';

export const themes = Object.entries(themeFactories).reduce((obj, [name, factory]) => {
    obj[name as keyof typeof themeFactories] = factory();
    return obj;
}, {} as Record<keyof typeof themeFactories, ChartThemeType>);
