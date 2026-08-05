import type { Framework, MenuItem } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { MarkdownActions } from '@ag-website-shared/components/markdown-actions/MarkdownActions';
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
    version?: string;
    markdownHref?: string;
}

export const Header: FunctionComponent<Props> = ({
    title,
    framework,
    isEnterprise,
    suppressFrameworkHeader,
    path,
    menuItems,
    version,
    markdownHref,
}) => {
    // Update framework store so it is in sync with the page
    // Done here, because it's run on all docs pages
    useSyncFrameworkStoreState(framework);

    return (
        <header className={styles.docsPageHeader}>
            <div className={styles.pageTitleContainer}>
                <div className={styles.titleMeta}>
                    {!suppressFrameworkHeader && (
                        <span className={styles.headerFramework}>{`${getFrameworkDisplayText(framework)} Charts`}</span>
                    )}
                    {version != null && <span className={styles.version}>{`Version ${version}`}</span>}
                </div>

                <div className={styles.headerActions}>
                    {markdownHref != null && <MarkdownActions markdownHref={markdownHref} framework={framework} />}
                    <div className={styles.frameworkSelectorSlot}>
                        <FrameworkSelectorInsideDocs path={path} currentFramework={framework} menuItems={menuItems} />
                    </div>
                </div>

                <h1 id="top" className={styles.docsPageTitle}>
                    <span>{title}</span>
                </h1>
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
