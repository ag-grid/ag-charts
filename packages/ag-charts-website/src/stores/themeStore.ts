import { persistentAtom } from '@nanostores/persistent';

export type ThemeName = 'ag-default' | 'ag-sheets' | 'ag-polychroma' | 'ag-vivid' | 'ag-material';

const LOCALSTORAGE_PREFIX = 'documentation';
const DEFAULT_INTERNAL_THEME: ThemeName = 'ag-default';

export const $theme = persistentAtom<ThemeName>(`${LOCALSTORAGE_PREFIX}:basetheme`, DEFAULT_INTERNAL_THEME, {
    listen: false,
});

export const setTheme = (themeName: ThemeName) => {
    // Update theme
    $theme.set(themeName);
};

export const getTheme = (): ThemeName => $theme.get();
