import type { ReactElement } from 'react';

import styles from './Highlight.module.scss';

export function Highlight({ children }: { children: ReactElement }) {
    return <span className={styles.highlight}>{children}</span>;
}
