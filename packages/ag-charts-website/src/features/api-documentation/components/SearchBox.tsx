import type { AllHTMLAttributes } from 'react';
import { Icon } from 'src/components/icon/Icon';
import styles from 'src/features/api-documentation/components/JsObjectView.module.scss';

export function SearchBox({ ...props }: AllHTMLAttributes<Element>) {
    return (<div className={...props}>
        <input className={styles.searchInput} type="search" placeholder="Search properties..." />
        <Icon svgClasses={styles.searchIcon} name={'search'} />
    </div>);
}
