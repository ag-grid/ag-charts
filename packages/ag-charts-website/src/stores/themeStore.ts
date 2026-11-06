import { persistentAtom } from '@nanostores/persistent';

export const BASE_THEME_NAMES = ['ag-default', 'ag-sheets', 'ag-polychroma', 'ag-vivid', 'ag-material'] as const;

export type BaseThemeName = (typeof BASE_THEME_NAMES)[number];

export type ThemeName = BaseThemeName | `${BaseThemeName}-dark`;

const LOCALSTORAGE_PREFIX = 'documentation';
const DEFAULT_INTERNAL_THEME: BaseThemeName = 'ag-default';

/** Also read by the gallery example page's head script, which runs before any store is loaded. */
export const THEME_STORAGE_KEY = `${LOCALSTORAGE_PREFIX}:basetheme`;

export const $theme = persistentAtom<BaseThemeName>(THEME_STORAGE_KEY, DEFAULT_INTERNAL_THEME, {
    listen: false,
});

export const setTheme = (baseThemeName: BaseThemeName) => {
    // Update theme
    $theme.set(baseThemeName);
};

export const getTheme = (): BaseThemeName => $theme.get();
