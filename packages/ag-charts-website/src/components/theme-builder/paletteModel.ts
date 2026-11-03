import {
    type Palette,
    type StrokeDirection,
    withPaletteDefaults,
} from '@ag-website-shared/components/theme-builder/palette';
import { atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import { RGBAColor } from '@ag-website-shared/theming/RGBAColor';
import { addChangedModelItem } from '@ag-website-shared/theming/changed-model-items';
import { useRenderedTheme } from '@ag-website-shared/theming/rendered-theme';
import type { Store } from '@ag-website-shared/theming/store';
import { paramToVariableName } from '@ag-website-shared/theming/utils';
import { useAtom, useAtomValue, useStore } from 'jotai';
import { useCallback } from 'react';

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

/** Only a preset: an import omits an accent to say the base theme's should show through. */
export const completePalette = (palette: Palette) => withPaletteDefaults(palette, DEFAULT_PALETTE);

export const usePalette = () => {
    const store = useStore();
    const [stored, setStored] = useAtom(paletteAtom);
    // No ParamModel for the provider's listeners to watch, so an edit reports itself.
    const setPalette = useCallback(
        (palette: Palette) => {
            setStored(palette);
            addChangedModelItem(store, 'charts-palette');
        },
        [store, setStored]
    );
    return [stored ?? DEFAULT_PALETTE, setPalette] as const;
};

export const useStoredPalette = () => useAtomValue(paletteAtom);

export const setStoredPalette = (store: Store, palette: Palette | undefined) => store.set(paletteAtom, palette);

export const getStoredPalette = (store: Store) => store.get(paletteAtom);

/** Whether the previews outline their series. Not part of the palette: a theme cannot switch strokes on. */
const previewStrokesAtom = atomWithJSONStorage<boolean>('charts-preview-strokes', false);

export const usePreviewStrokes = () => useAtom(previewStrokesAtom);

const resolveParamColor = (param: string) => RGBAColor.reinterpretCss(`var(${paramToVariableName(param)})`);

/**
 * Linked strokes lighten their fill when the text is lighter than the background,
 * as the stock dark themes' strokes do. Resolved through the rendered theme's CSS,
 * since either colour may be a reference or a mix.
 */
export const useStrokeDirection = (): StrokeDirection => {
    // Subscribed for the re-render on a param edit; the colours are read from the CSS it installs.
    useRenderedTheme();
    const foreground = resolveParamColor('foregroundColor');
    const background = resolveParamColor('backgroundColor');
    return foreground && background && foreground.grayscale() > background.grayscale() ? 'lighten' : 'darken';
};
