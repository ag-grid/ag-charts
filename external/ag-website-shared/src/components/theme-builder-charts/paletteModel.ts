import { type Palette, withPaletteDefaults } from '@ag-website-shared/components/theme-builder/palette';
import { atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import type { Store } from '@ag-website-shared/theming/store';
import { useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { DEFAULT_THEME_NAME, getPalette } from './chartsTheme';

/**
 * Where AG Charts keeps its palette.
 *
 * The palette is the half of an AG Charts theme with no counterpart in the shared
 * param model, which knows only about flat named params - so it lives in its own
 * atom alongside them, and the host composes the two when it builds the preview
 * theme and the exported snippet.
 *
 * Only the storage binding is here. The shape, the transforms and the editor are
 * host-agnostic and live in `theme-builder/palette.ts`, because Studio has the
 * same palette spread across numbered theme params and can reuse all three.
 */

const DEFAULT_PALETTE = getPalette(DEFAULT_THEME_NAME);

/** Unset means "inherit the base theme's palette". */
const paletteAtom = atomWithJSONStorage<Palette | undefined>('charts-palette', undefined);

const completed = (palette: Palette) => withPaletteDefaults(palette, DEFAULT_PALETTE);

export const usePalette = () => {
    const [stored, setStored] = useAtom(paletteAtom);
    const palette = useMemo(() => (stored == null ? DEFAULT_PALETTE : completed(stored)), [stored]);
    return [palette, setStored] as const;
};

// Memoised because the preview theme is rebuilt whenever this changes by
// identity, and a fresh object every render would restart the chart's animation.
export const useStoredPalette = () => {
    const stored = useAtomValue(paletteAtom);
    return useMemo(() => (stored == null ? undefined : completed(stored)), [stored]);
};

export const setStoredPalette = (store: Store, palette: Palette | undefined) => store.set(paletteAtom, palette);
