import { Icon } from '@ag-website-shared/components/icon/Icon';
import type { AgGridReact } from 'ag-grid-react';
import { type RefObject, useCallback } from 'react';

import styles from './ModuleSearch.module.scss';

export function ModuleSearch({ gridRef }: { gridRef: RefObject<AgGridReact> }) {
    const onInput = useCallback(
        (searchText: string) => {
            gridRef?.current?.api.setGridOption('quickFilterText', searchText);
        },
        [gridRef]
    );

    return (
        <div className={styles.searchBox}>
            <Icon name="search" svgClasses={styles.searchIcon} />

            <input
                className={styles.searchInput}
                type="search"
                placeholder="Search modules"
                onInput={(event) => {
                    onInput((event.target as HTMLInputElement).value);
                }}
            />
        </div>
    );
}
