import type { IconName } from '@components/icon/Icon';
import { Icon } from '@components/icon/Icon';
import classnames from 'classnames';
import type { AllHTMLAttributes } from 'react';

import styles from './JsObjectView.module.scss';

export function SearchBox({
    className,
    placeholder = 'Search properties...',
    iconName = 'search',
    ...props
}: AllHTMLAttributes<Element> & { iconName?: IconName }) {
    return (
        <div className={classnames(styles.searchOuter, className)} {...props}>
            <input className={styles.searchInput} type="search" placeholder={placeholder} />
            <Icon svgClasses={styles.searchIcon} name={iconName} />
        </div>
    );
}
