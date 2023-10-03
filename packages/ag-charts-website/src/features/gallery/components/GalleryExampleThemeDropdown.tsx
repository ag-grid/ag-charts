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
                <option value="ag-default">ag-default</option>
                <option value="ag-material">ag-material</option>
                <option value="ag-pastel">ag-pastel</option>
                <option value="ag-solar">ag-solar</option>
                <option value="ag-vivid">ag-vivid</option>
                <option value="ag-default-dark">ag-default-dark</option>
                <option value="ag-material-dark">ag-material-dark</option>
                <option value="ag-pastel-dark">ag-pastel-dark</option>
                <option value="ag-solar-dark">ag-solar-dark</option>
                <option value="ag-vivid-dark">ag-vivid-dark</option>
                <option value="deordered">deordered</option>
                <option value="mini-hue">mini-hue</option>
                <option value="enter">enter</option>
                <option value='enter'></option>
                <option value='enterprise-001'>enterprise-001</option>
                <option value='enterprise-002'>enterprise-002</option>
                <option value='enterprise-003'>enterprise-003</option>
                <option value='excel'>excel</option>
            </select>
        </div>
    );
};
