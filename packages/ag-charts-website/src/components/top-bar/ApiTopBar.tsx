import type { ApiMenuItem, Framework } from '@ag-grid-types';
import { DEFAULT_FRAMEWORK } from '@constants';
import { useStore } from '@nanostores/react';
import { $internalFramework } from '@stores/frameworkStore';
import { getFrameworkFromInternalFramework, replaceDynamicFrameworkPath } from '@utils/framework';
import { getPathFromUrlPathname } from '@utils/getPathFromUrlPathname';
import { pathJoin } from '@utils/pathJoin';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import { type FunctionComponent, useEffect, useMemo, useState } from 'react';

import styles from './ApiTopBar.module.scss';

interface Props {
    menuItems: ApiMenuItem[];
    fullPath: string;
}

export const ApiTopBar: FunctionComponent<Props> = ({ menuItems, fullPath }) => {
    const pagePath = pathJoin('/', getPathFromUrlPathname(fullPath));
    const [framework, setFramework] = useState<Framework>(DEFAULT_FRAMEWORK);
    const internalFramework = useStore($internalFramework);

    useEffect(() => {
        setFramework(getFrameworkFromInternalFramework(internalFramework));
    }, [internalFramework]);

    const menuItemsWithFrameworkLinks = useMemo(
        () =>
            menuItems.map((item) => {
                const path = replaceDynamicFrameworkPath({
                    dynamicFrameworkPath: item.path,
                    framework,
                });
                return {
                    ...item,
                    path,
                };
            }),
        [framework, menuItems]
    );

    return (
        <div className={classnames(styles.toolbar, styles.toolbarNav)}>
            <div className={styles.controlsContainer}>
                <div className={styles.controls}>
                    <nav>
                        <ul className="list-style-none">
                            {menuItemsWithFrameworkLinks.map(({ title, path }) => (
                                <li key={path} className={pagePath === path ? styles.active : ''}>
                                    <a href={urlWithBaseUrl(path)}>{title}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
            <div className={styles.scrollIndicator}></div>
        </div>
    );
};
