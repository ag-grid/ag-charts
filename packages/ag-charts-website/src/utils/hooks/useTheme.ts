import { $darkmode, type DarkModeTheme, getDarkmode, setDarkmode } from '@stores/darkmodeStore';
import { $theme, type BaseThemeName, setTheme } from '@stores/themeStore';
import { useEffect } from 'react';

import { useStoreSsr } from './useStoreSsr';

export function useTheme() {
    const darkmode = useStoreSsr<DarkModeTheme>($darkmode, 'unknown');
    const themeName = useStoreSsr<BaseThemeName>($theme, 'ag-default');

    useEffect(() => {
        if (getDarkmode() === 'unknown') {
            const darkMode = window.matchMedia('(prefers-color-scheme: dark)')?.matches === true;
            setDarkmode(darkMode);
        }
    }, []);

    const theme = darkmode === 'dark' ? `${themeName}-dark` : themeName;

    return {
        theme,
        themeName,
        setThemeName: setTheme,
    };
}
