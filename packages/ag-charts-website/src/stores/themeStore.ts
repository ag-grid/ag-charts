import { persistentAtom } from '@nanostores/persistent';

export type BaseThemeName = 'ag-default' | 'ag-sheets' | 'ag-polychroma' | 'ag-vivid' | 'ag-material';

const LOCALSTORAGE_PREFIX = 'documentation';
const DEFAULT_INTERNAL_THEME: BaseThemeName = 'ag-default';

export const $theme = persistentAtom<BaseThemeName>(`${LOCALSTORAGE_PREFIX}:basetheme`, DEFAULT_INTERNAL_THEME, {
    listen: false,
});

export const setTheme = (themeName: BaseThemeName) => {
    // Update theme
    $theme.set(themeName);
};

export const getTheme = (): BaseThemeName => $theme.get();
