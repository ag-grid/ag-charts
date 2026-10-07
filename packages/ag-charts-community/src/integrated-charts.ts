import {
    Arc,
    BBox,
    Caption,
    CategoryScale,
    Group,
    Line,
    LinearScale,
    Marker,
    Path,
    RadialColumnShape,
    Rect,
    Scene,
    Sector,
    Shape,
    TranslatableGroup,
    getRadialColumnWidth,
    toRadians,
} from './integrated-charts-scene';
import type * as SceneExports from './integrated-charts-scene';
import { ChartTheme, getChartTheme, resolveOperation, themeNames, themes } from './integrated-charts-theme';
import type * as ThemeExports from './integrated-charts-theme';
import { Color, interpolateColor } from './integrated-charts-util';
import type * as UtilExports from './integrated-charts-util';

// Plain objects rather than `export * as` namespaces, so bundlers drop them when Integrated Charts is unused.
export const _Scene: typeof SceneExports = {
    Arc,
    BBox,
    Caption,
    CategoryScale,
    Group,
    LinearScale,
    Line,
    Marker,
    Path,
    RadialColumnShape,
    Rect,
    Scene,
    Sector,
    Shape,
    TranslatableGroup,
    getRadialColumnWidth,
    toRadians,
};

export const _Theme: typeof ThemeExports = { ChartTheme, getChartTheme, resolveOperation, themeNames, themes };

export const _Util: typeof UtilExports = { Color, interpolateColor };
