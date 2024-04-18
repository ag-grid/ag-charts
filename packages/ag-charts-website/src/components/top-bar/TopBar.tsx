import { Icon } from '@ag-website-shared/components/icon/Icon';
import { getNewFrameworkPath } from '@utils/framework';
import classNames from 'classnames';

import { FrameworkSelector } from '../framework-selector/FrameworkSelector';
import styles from './TopBar.module.scss';

export const TopBar = ({ frameworks, currentFramework, path, isDev, suppressFrameworkSelector }) => {
    const frameworksData = frameworks.map((framework) => ({
        name: framework,
        url: getNewFrameworkPath({
            path,
            currentFramework,
            newFramework: framework,
        }),
    }));

    return (
        <div className={styles.topBar}>
            <div className="layout-page-max-width">
                <div className={styles.topBarInner}>
                    <button
                        id="top-bar-docs-button"
                        className={classNames(styles.topBarNavButton, 'button-secondary')}
                        type="button"
                        data-toggle="collapse"
                        data-target="#side-nav"
                        aria-controls="side-nav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span>Docs</span>
                        <Icon name="collapseCategories" />
                    </button>

                    {!suppressFrameworkSelector && currentFramework && (
                        <FrameworkSelector
                            data={frameworksData}
                            currentFramework={currentFramework}
                            showSelectedFramework
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
