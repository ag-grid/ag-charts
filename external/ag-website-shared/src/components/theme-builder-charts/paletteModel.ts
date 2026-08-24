import type { Palette } from '@ag-website-shared/components/theme-builder/palette';
import { atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import type { Store } from '@ag-website-shared/theming/store';
import { useAtom, useAtomValue } from 'jotai';

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

export const usePalette = () => {
    const [stored, setStored] = useAtom(paletteAtom);
    return [stored ?? DEFAULT_PALETTE, setStored] as const;
};

export const useStoredPalette = () => useAtomValue(paletteAtom);

export const setStoredPalette = (store: Store, palette: Palette | undefined) => store.set(paletteAtom, palette);
