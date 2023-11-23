import { Icon } from '@components/icon/Icon';
import classnames from 'classnames';

import styles from './FeatureTitle.module.scss';

type FeatureTitleProps = {
    title: string;
    isRoot?: boolean;
    isEnterprise?: boolean;
    path?: string;
};

export const FeatureTitle = ({ title, isRoot, path, isEnterprise }: FeatureTitleProps) => {
    const textClassName = isRoot ? styles.featureGroup : styles.feature;
    return (
        <div className={styles.featureTitleContainer}>
            {path ? (
                <a href={path} className={classnames([styles.featureTitleLink, textClassName])}>
                    {title}
                </a>
            ) : (
                <span className={classnames([styles.featureTitleLink, textClassName])}>{title}</span>
            )}
            {isEnterprise && <Icon name="enterprise" svgClasses={styles.enterpriseIcon} />}
        </div>
    );
};
