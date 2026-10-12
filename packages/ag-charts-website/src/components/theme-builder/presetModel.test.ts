import { getRenderedBaseThemeAtom } from '@ag-website-shared/theming/base-theme';
import type { Store } from '@ag-website-shared/theming/store';
import { getThemeDefaultParams } from '@ag-website-shared/theming/utils';
import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import type { AgChartThemeName } from 'ag-charts-community';

import { getStackParams } from './chartsTheme';
import { setImportedBaseTheme, setInitialBaseTheme, setSelectedPresetId } from './presetModel';
import './registerThemeBuilderConfig';

const COLOUR_PARAMS = ['backgroundColor', 'foregroundColor', 'textColor'];

const pickColours = (params: Record<string, unknown>) =>
    Object.fromEntries(COLOUR_PARAMS.map((property) => [property, params[property]]));

/** The defaults the fields fall back to, read through the theme the shared model renders. */
const fieldDefaults = (store: Store) => pickColours(getThemeDefaultParams(store.get(getRenderedBaseThemeAtom())));

const stockDefaults = (themeName: AgChartThemeName) => pickColours(getStackParams(themeName));

describe('base theme the fields read from', () => {
    it('distinguishes the light and dark stock themes', () => {
        expect(stockDefaults('ag-default-dark')).not.toEqual(stockDefaults('ag-default'));
    });

    it('follows the selected preset', () => {
        const store = createStore();
        setSelectedPresetId(store, 'default');
        expect(fieldDefaults(store)).toEqual(stockDefaults('ag-default'));

        setSelectedPresetId(store, 'midnight');
        expect(fieldDefaults(store)).toEqual(stockDefaults('ag-default-dark'));
    });

    it('follows an imported base theme over the preset', () => {
        const store = createStore();
        setSelectedPresetId(store, null);
        setImportedBaseTheme(store, 'ag-polychroma-dark');
        expect(fieldDefaults(store)).toEqual(stockDefaults('ag-polychroma-dark'));
    });

    it('falls back to the initial preset when neither names one', () => {
        const store = createStore();
        setSelectedPresetId(store, null);
        setInitialBaseTheme(store, 'ag-default-dark');
        expect(fieldDefaults(store)).toEqual(stockDefaults('ag-default-dark'));
    });
});
