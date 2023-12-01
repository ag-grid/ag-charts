import { $theme, type BaseThemeName, type ThemeName, setTheme } from '@stores/themeStore';

import { useStoreSsr } from './useStoreSsr';

export type { BaseThemeName, ThemeName };

export const useTheme = () => {
    const theme = useStoreSsr<BaseThemeName>($theme, 'ag-default');

    return [theme, setTheme] as const;
};
