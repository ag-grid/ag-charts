import type { Framework } from '@ag-grid-types';
import { Icon } from '@components/icon/Icon';
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
    return (
        <div className={styles.featureTitleContainer}>
            {path ? (
                <a
                    href={urlWithPrefix({ framework, url: path })}
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
