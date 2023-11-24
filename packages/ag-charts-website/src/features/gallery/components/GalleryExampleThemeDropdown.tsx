import { type ThemeName, useTheme } from '@utils/hooks/useTheme';
import { type ChangeEvent, type FunctionComponent } from 'react';

import styles from './GalleryExampleThemeDropdown.module.scss';

export const GalleryExampleThemeDropdown: FunctionComponent = () => {
    const { setThemeName, themeName } = useTheme();

    const applyTheme = (event: ChangeEvent<HTMLSelectElement>) => {
        setThemeName(event.target.value as ThemeName);
    };

    return (
        <div className={styles.toolPanel}>
            <select id="theme-select" value={themeName} onChange={applyTheme}>
                <option value="ag-default">ag-default</option>
                <option value="ag-sheets">ag-sheets</option>
                <option value="ag-polychroma">ag-polychroma</option>
                <option value="ag-vivid">ag-vivid</option>
                <option value="ag-material">ag-material</option>
            </select>
        </div>
    );
};
