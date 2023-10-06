import { persistentAtom } from '@nanostores/persistent';

export type ThemeName =
    | 'ag-default'
    | 'ag-default-dark'
    | 'ag-excel'
    | 'ag-excel-dark'
    | 'ag-polychroma'
    | 'ag-polychroma-dark'
    | 'ag-vivid'
    | 'ag-vivid-dark'
    | 'ag-material'
    | 'ag-material-dark';

const LOCALSTORAGE_PREFIX = 'documentation';
const DEFAULT_INTERNAL_THEME: ThemeName = 'ag-default';

export const $theme = persistentAtom<ThemeName>(`${LOCALSTORAGE_PREFIX}:theme`, DEFAULT_INTERNAL_THEME);

export const setTheme = (themeName: ThemeName) => {
    // Update theme
    $theme.set(themeName);
};

export const getTheme = (): ThemeName => $theme.get();
