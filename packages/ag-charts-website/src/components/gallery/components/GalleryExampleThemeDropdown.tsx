import { type BaseThemeName, useTheme } from '@utils/hooks/useTheme';
import { type ChangeEvent, type FunctionComponent } from 'react';

export const GalleryExampleThemeDropdown: FunctionComponent = () => {
    const [theme, setTheme] = useTheme();

    const applyTheme = (event: ChangeEvent<HTMLSelectElement>) => {
        setTheme(event.target.value as BaseThemeName);
    };

    return (
        <select id="theme-select" value={theme} onChange={applyTheme}>
            <option value="ag-default">ag-default</option>
            <option value="ag-sheets">ag-sheets</option>
            <option value="ag-polychroma">ag-polychroma</option>
            <option value="ag-vivid">ag-vivid</option>
            <option value="ag-material">ag-material</option>
        </select>
    );
};
