import type { ThemeName } from '@stores/themeStore';

export const getDarkModeTheme = (currentTheme: ThemeName, preset?: string): ThemeName => {
    const darkThemeSuffix = '-dark';

    if (preset != null) {
        return 'ag-financial-dark' as ThemeName;
    }

    return currentTheme.substring(0, currentTheme.length - darkThemeSuffix.length) as ThemeName;
};
