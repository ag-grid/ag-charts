import { persistentAtom } from '@nanostores/persistent';

export type ThemeName =
    | 'ag-default'
    | 'ag-material'
    | 'ag-pastel'
    | 'ag-solar'
    | 'ag-vivid'
    | 'ag-default-dark'
    | 'ag-material-dark'
    | 'ag-pastel-dark'
    | 'ag-solar-dark'
    | 'ag-vivid-dark'
    | 'deordered'
    | 'mini-hue'
    | 'enter'
    | 'enterprise-001'
    | 'enterprise-002'
    | 'enterprise-003'
    | 'excel';

const LOCALSTORAGE_PREFIX = 'documentation';
const DEFAULT_INTERNAL_THEME: ThemeName = 'ag-default';

export const $theme = persistentAtom<ThemeName>(`${LOCALSTORAGE_PREFIX}:theme`, DEFAULT_INTERNAL_THEME);

export const setTheme = (themeName: ThemeName) => {
    // Update theme
    $theme.set(themeName);
};

export const getTheme = (): ThemeName => $theme.get();
