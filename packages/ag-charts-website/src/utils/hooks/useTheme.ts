import { getDarkModeTheme } from '@features/gallery/utils/getDarkModeTheme';
import { useStore } from '@nanostores/react';
import { $darkmode } from '@stores/darkmodeStore';
import { $theme, type ThemeName, setTheme } from '@stores/themeStore';
import { useCallback, useEffect, useMemo } from 'react';

export function useTheme() {
    const darkmode = useStore($darkmode);
    const theme = useStore($theme);
    const displayName = useMemo(() => theme.replace('-dark', ''), [theme]);

    const updateDarkModeTheme = useCallback(
        (newTheme: ThemeName) => {
            const isDarkMode = typeof darkmode === 'string' ? darkmode === 'true' : darkmode;
            const newDarkModeTheme = getDarkModeTheme(newTheme, isDarkMode);

            if (newDarkModeTheme !== theme) {
                setTheme(newDarkModeTheme);
            }
        },
        [darkmode, theme]
    );

    // Update theme if darkmode changes
    useEffect(() => {
        updateDarkModeTheme(theme);
    }, [darkmode, theme]);

    return {
        theme,
        displayName,
        updateDarkModeTheme,
    };
}
