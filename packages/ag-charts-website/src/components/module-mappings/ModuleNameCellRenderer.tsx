import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ModuleNameCellRenderer.module.scss';

export function ModuleNameCellRenderer({ data: { moduleName, hide } }: CustomCellRendererProps) {
    if (hide) {
        return 'Included automatically';
    }

    return moduleName ? <code className={styles.moduleName}>{moduleName}</code> : null;
}
