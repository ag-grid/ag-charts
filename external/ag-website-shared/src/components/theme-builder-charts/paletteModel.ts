import { atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import type { Store } from '@ag-website-shared/theming/store';
import type { AgChartThemePalette, AgPaletteColors } from 'ag-charts-community';
import { useAtom, useAtomValue } from 'jotai';

import { DEFAULT_THEME_NAME, getPalette } from './chartsTheme';

/**
 * The palette - the series colours - is the half of an AG Charts theme with no
 * counterpart in the shared model, which knows only about flat named params. It
 * lives in its own atom alongside them, and the host composes the two when it
 * builds the preview theme and the exported snippet.
 *
 * This mirrors how Studio carries `widgetBorder`: state that belongs to a preset
 * but is not a theme param, held by the host and adapted at the boundary.
 */

export type Palette = Required<AgChartThemePalette>;

export const DEFAULT_PALETTE = getPalette(DEFAULT_THEME_NAME);

/** Unset means "inherit the base theme's palette". */
const paletteAtom = atomWithJSONStorage<Palette | undefined>('charts-palette', undefined);

export const usePalette = () => {
    const [stored, setStored] = useAtom(paletteAtom);
    return [stored ?? DEFAULT_PALETTE, setStored] as const;
};

export const useStoredPalette = () => useAtomValue(paletteAtom);

export const setStoredPalette = (store: Store, palette: Palette | undefined) => store.set(paletteAtom, palette);

export const getStoredPalette = (store: Store) => store.get(paletteAtom);

/** Fills and strokes are index-paired, so the editor works in series slots. */
export type SeriesColor = { fill: string; stroke: string };

export const toSeriesColors = ({ fills, strokes }: Palette): SeriesColor[] =>
    fills.map((fill, index) => ({ fill: String(fill), stroke: strokes[index] ?? String(fill) }));

export const fromSeriesColors = (palette: Palette, colors: SeriesColor[]): Palette => ({
    ...palette,
    fills: colors.map(({ fill }) => fill),
    strokes: colors.map(({ stroke }) => stroke),
});

export const withAccentColors = (
    palette: Palette,
    key: 'up' | 'down' | 'neutral',
    value: AgPaletteColors
): Palette => ({
    ...palette,
    [key]: value,
});
