import type { Framework } from '@ag-grid-types';
import { FrameworkSelectorInsideDocs } from '@components/framework-selector-inside-doc/FrameworkSelectorInsideDocs';
import { Icon } from '@components/icon/Icon';
import { getFrameworkDisplayText } from '@utils/framework';
import type { FunctionComponent } from 'react';

import styles from './Header.module.scss';

interface Props {
    title: string;
    framework: Framework;
    isEnterprise?: boolean;
    suppressFrameworkHeader?: boolean;
    path: string;
}

export const Header: FunctionComponent<Props> = ({ title, framework, isEnterprise, suppressFrameworkHeader, path }) => {
    return (
        <header className={styles.docsPageHeader}>
            <h1 id="top" className={styles.docsPageTitle}>
                <div className={styles.pageTitleContainer}>
                    <div className={styles.pageTitleGroup}>
                        {!suppressFrameworkHeader && (
                            <span className={styles.headerFramework}>{getFrameworkDisplayText(framework)} Charts</span>
                        )}
                        <span>{title}</span>
                    </div>

                    <FrameworkSelectorInsideDocs path={path} currentFramework={framework} />
                </div>

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
