import type { Framework, MenuItem } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { FrameworkSelectorInsideDocs } from '@components/framework-selector-inside-doc/FrameworkSelectorInsideDocs';
import { getFrameworkDisplayText } from '@utils/framework';
import { useSyncFrameworkStoreState } from '@utils/hooks/useSyncFrameworkStoreState';
import type { FunctionComponent } from 'react';

import styles from './Header.module.scss';

interface Props {
    title: string;
    framework: Framework;
    isEnterprise?: boolean;
    suppressFrameworkHeader?: boolean;
    path: string;
    menuItems: MenuItem[];
}

export const Header: FunctionComponent<Props> = ({
    title,
    framework,
    isEnterprise,
    suppressFrameworkHeader,
    path,
    menuItems,
    version,
}) => {
    // Update framework store so it is in sync with the page
    // Done here, because it's run on all docs pages
    useSyncFrameworkStoreState(framework);

    return (
        <header className={styles.docsPageHeader}>
            <div className={styles.pageTitleContainer}>
                <div className={styles.pageTitleGroup}>
                    <h1 id="top" className={styles.docsPageTitle}>
                        {!suppressFrameworkHeader && (
                            <span className={styles.headerFramework}>
                                {`${getFrameworkDisplayText(framework)} Charts`}{' '}
                                {version && (
                                    <a className={styles.headerVersion} href="/documentation-archive">
                                        v{version}
                                    </a>
                                )}
                            </span>
                        )}
                        <span>{title}</span>
                    </h1>
                </div>
                <FrameworkSelectorInsideDocs path={path} currentFramework={framework} menuItems={menuItems} />
            </div>

            {isEnterprise && (
                <span className={styles.enterpriseLabel}>
                    Enterprise
                    <Icon name="enterprise" />
                </span>
            )}
        </header>
    );
};
