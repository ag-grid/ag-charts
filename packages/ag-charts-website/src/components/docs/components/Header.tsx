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
            {/* `#top` is the side navigation's scroll target, so it sits on the container rather than
                the h1: the h1 is `display: contents` and so has no box to scroll to. */}
            <div id="top" className={styles.pageTitleContainer}>
                {/* The framework name must stay inside the h1 to count towards it for SEO; the version
                    must stay outside it, or it would read as part of the heading. `data-page-title` is
                    how the Algolia indexer finds the page title within the heading. */}
                <h1 className={styles.docsPageTitle}>
                    {!suppressFrameworkHeader && (
                        <span className={styles.headerFramework}>{`${getFrameworkDisplayText(framework)} Charts`}</span>
                    )}
                    <span className={styles.titleText} data-page-title>
                        {title}
                    </span>
                </h1>

                {version != null && <span className={styles.version}>{`Version ${version}`}</span>}

                <div className={styles.headerActions}>
                    {markdownHref != null && <MarkdownActions markdownHref={markdownHref} />}
                    <div className={styles.frameworkSelectorSlot}>
                        <FrameworkSelectorInsideDocs path={path} currentFramework={framework} menuItems={menuItems} />
                    </div>
                </div>
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
