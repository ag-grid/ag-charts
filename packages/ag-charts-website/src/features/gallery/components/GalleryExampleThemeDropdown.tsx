import { useStore } from '@nanostores/react';
import { $darkmode } from '@stores/darkmodeStore';
import { $theme, ThemeName, setTheme } from '@stores/themeStore';
import type { ChangeEvent, FunctionComponent } from 'react';
import { useEffect } from 'react';

import styles from './GalleryExampleThemeDropdown.module.scss';

const getTheme = (currentTheme: ThemeName, isDarkMode: boolean): ThemeName => {
    const darkThemeSuffix = '-dark';
    const hasDarkSuffix = currentTheme.endsWith(darkThemeSuffix);

    if (isDarkMode === hasDarkSuffix) return currentTheme;

    return isDarkMode
        ? (`${currentTheme}${darkThemeSuffix}` as ThemeName)
        : (currentTheme.substring(0, currentTheme.length - darkThemeSuffix.length) as ThemeName);
};

export const GalleryExampleThemeDropdown: FunctionComponent = () => {
    const darkmode = useStore($darkmode);
    const theme = useStore($theme);
    const isDarkMode = typeof darkmode === 'string' ? darkmode === 'true' : darkmode;

    const getThemeName = () => theme.replace('-dark', '');

    const updateTheme = (newTheme: ThemeName) => {
        if (newTheme !== theme) {
            setTheme(newTheme);
        }
    };

    const applyTheme = (event: ChangeEvent<HTMLSelectElement>) => {
        updateTheme(getTheme(event.target.value as ThemeName, isDarkMode));
    };

    useEffect(() => {
        updateTheme(getTheme(theme, isDarkMode));
    }, [isDarkMode, theme]);

    return (
        <div className={styles.toolPanel}>
            <select id="theme-select" value={getThemeName()} onChange={applyTheme}>
                <option value="ag-default">ag-default</option>
                <option value="ag-sheets">ag-sheets</option>
                <option value="ag-polychroma">ag-polychroma</option>
                <option value="ag-vivid">ag-vivid</option>
                <option value="ag-material">ag-material</option>
            </select>
        </div>
    );
};
