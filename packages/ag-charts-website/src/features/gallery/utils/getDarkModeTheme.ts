import { type ThemeName } from '@stores/themeStore';

export const getDarkModeTheme = (currentTheme: ThemeName, isDarkMode: boolean): ThemeName => {
    const darkThemeSuffix = '-dark';
    const hasDarkSuffix = currentTheme.endsWith(darkThemeSuffix);

    if (isDarkMode === hasDarkSuffix) return currentTheme;

    return isDarkMode
        ? (`${currentTheme}${darkThemeSuffix}` as ThemeName)
        : (currentTheme.substring(0, currentTheme.length - darkThemeSuffix.length) as ThemeName);
};
