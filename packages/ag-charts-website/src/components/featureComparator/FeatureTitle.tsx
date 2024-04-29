import type { Framework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import classnames from 'classnames';

import styles from './FeatureTitle.module.scss';

type FeatureTitleProps = {
    title: string;
    isRoot?: boolean;
    isEnterprise?: boolean;
    path?: string;
    framework: Framework;
};

export const FeatureTitle = ({ title, isRoot, path, isEnterprise, framework }: FeatureTitleProps) => {
    const textClassName = isRoot ? styles.featureGroup : undefined;
    const pathToUse = path ? './' + path.replace(/^\/+/, '') : undefined;
    return (
        <div className={styles.featureTitleContainer}>
            {pathToUse ? (
                <a
                    href={urlWithPrefix({ framework, url: pathToUse })}
                    className={classnames([styles.featureTitleLink, textClassName])}
                >
                    {title}
                </a>
            ) : (
                <span className={classnames([styles.featureTitleLink, textClassName])}>{title}</span>
            )}
            {isEnterprise && <Icon name="enterprise" svgClasses={styles.enterpriseIcon} />}
        </div>
    );
};
