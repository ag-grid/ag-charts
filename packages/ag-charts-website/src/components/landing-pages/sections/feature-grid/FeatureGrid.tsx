import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import type { FeatureGridItem } from '../../types';
import styles from './FeatureGrid.module.scss';

interface Props {
    items: FeatureGridItem[];
}

export const FeatureGrid = ({ items }: Props) => {
    return (
        <div className={styles.featureGrid}>
            {items.map((item, index) => (
                <a
                    href={urlWithBaseUrl(item.link)}
                    key={item.title}
                    id={`feature-${item.title.replace(/\s+/g, '-').toLowerCase()}`}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                >
                    <div className={styles.featureCard} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className={styles.iconWrapper}>
                            <Icon name={item.icon as IconName} svgClasses={styles.icon} />
                        </div>
                        <h3 className={styles.title}>{item.title}</h3>
                        <p className={styles.description}>{item.description}</p>
                    </div>
                </a>
            ))}
        </div>
    );
};
