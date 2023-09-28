import type { Framework } from '@ag-grid-types';
import { Icon } from '@components/icon/Icon';
import { getFrameworkDisplayText } from '@utils/framework';
import type { FunctionComponent } from 'react';
import styles from './Header.module.scss';

interface Props {
    title: string;
    framework: Framework;
    isEnterprise?: boolean;
}

export const Header: FunctionComponent<Props> = ({ title, framework, isEnterprise }) => {
    return (
        <header className={styles.docsPageHeader}>
            <h1 id="top" className={styles.docsPageTitle}>
                <span className={styles.headerFramework}>{getFrameworkDisplayText(framework)} Charts</span>
                <span>{title}</span>

                {isEnterprise && (
                    <span className={styles.enterpriseLabel}>
                        Enterprise
                        <Icon name="enterprise" />
                    </span>
                )}
            </h1>
        </header>
    );
};
