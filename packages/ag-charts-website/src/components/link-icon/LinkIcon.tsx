import { Icon } from '@components/icon/Icon';
import classnames from 'classnames';
import type { AllHTMLAttributes } from 'react';

import styles from './LinkIcon.module.scss';

export function LinkIcon({ className, ...props }: AllHTMLAttributes<HTMLAnchorElement> & { children?: never }) {
    return (
        <a {...props} className={classnames(styles.docsHeaderIcon, className)}>
            <Icon name="link" />
        </a>
    );
}
