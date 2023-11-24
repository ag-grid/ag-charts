import { $theme, type ThemeName, setTheme } from '@stores/themeStore';

import { useStoreSsr } from './useStoreSsr';

export type { ThemeName };

export const useTheme = () => {
    const theme = useStoreSsr<ThemeName>($theme, 'ag-default');

    return [theme, setTheme] as const;
};
