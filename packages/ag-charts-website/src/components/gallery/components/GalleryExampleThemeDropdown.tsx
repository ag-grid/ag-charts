import { BASE_THEME_NAMES } from '@stores/themeStore';
import { type BaseThemeName, useTheme } from '@utils/hooks/useTheme';
import { type ChangeEvent, type FunctionComponent } from 'react';

export const GalleryExampleThemeDropdown: FunctionComponent = () => {
    const [theme, setTheme] = useTheme();

    const applyTheme = (event: ChangeEvent<HTMLSelectElement>) => {
        setTheme(event.target.value as BaseThemeName);
    };

    return (
        <select id="theme-select" value={theme} onChange={applyTheme}>
            {BASE_THEME_NAMES.map((themeName) => (
                <option key={themeName} value={themeName}>
                    {themeName}
                </option>
            ))}
        </select>
    );
};
