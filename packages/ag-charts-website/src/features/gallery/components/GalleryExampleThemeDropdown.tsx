import { useStore } from '@nanostores/react';
import { $theme, setTheme } from '@stores/themeStore';
import type { FunctionComponent } from 'react';

import styles from './GalleryExampleThemeDropdown.module.scss';

export const GalleryExampleThemeDropdown: FunctionComponent = () => {
    const theme = useStore($theme);

    const applyTheme = (event: any) => {
        setTheme(event.target.value);
    };

    return (
        <div className={styles.toolPanel}>
            <select id="theme-select" value={theme} onChange={applyTheme}>
                <option value="ag-default" selected>
                    ag-default
                </option>
                <option value="ag-default-dark">ag-default-dark</option>
                <option value="ag-excel">ag-excel</option>
                <option value="ag-excel-dark">ag-excel-dark</option>
                <option value="ag-polychroma">ag-polychroma</option>
                <option value="ag-polychroma-dark">ag-polychroma-dark</option>
                <option value="ag-vivid">ag-vivid</option>
                <option value="ag-vivid-dark">ag-vivid-dark</option>
                <option value="ag-material">ag-material</option>
                <option value="ag-material-dark">ag-material-dark</option>
            </select>
        </div>
    );
};
