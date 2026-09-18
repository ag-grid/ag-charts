import { type Palette, withPaletteDefaults } from '@ag-website-shared/components/theme-builder/palette';
import { atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import type { Store } from '@ag-website-shared/theming/store';
import { useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { DEFAULT_THEME_NAME, getPalette } from './chartsTheme';

/**
 * The palette has no counterpart in the shared param model, which knows only flat
 * named params, so it gets an atom of its own and the host composes the two. Only
 * the storage binding is here - the shape and transforms are host-agnostic and
 * live in `theme-builder/palette.ts`.
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

/** `useStoredPalette` for callers outside React, completions and all. */
export const getStoredPalette = (store: Store) => {
    const stored = store.get(paletteAtom);
    return stored == null ? undefined : completed(stored);
};
