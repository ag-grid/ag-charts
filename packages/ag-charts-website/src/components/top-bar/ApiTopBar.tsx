import type { ApiMenuItem } from '@ag-grid-types';
import { getPathFromUrlPathname, urlWithBaseUrl } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';
import classnames from 'classnames';
import type { FunctionComponent } from 'react';

import styles from './ApiTopBar.module.scss';

interface Props {
    menuItems: ApiMenuItem[];
    fullPath: string;
}

export const ApiTopBar: FunctionComponent<Props> = ({ menuItems, fullPath }) => {
    const pagePath = pathJoin('/', getPathFromUrlPathname(fullPath));

    return (
        <div className={styles.topBar}>
            <div className={classnames(styles.topBarInner, 'page-margin')}>
                <nav>
                    <ul className="list-style-none">
                        {menuItems.map(({ title, path }) => (
                            <li className={pagePath === path ? styles.active : ''}>
                                <a href={urlWithBaseUrl(path)}>{title}</a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    );
};
