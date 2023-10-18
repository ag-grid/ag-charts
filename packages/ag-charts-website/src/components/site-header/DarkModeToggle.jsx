import { useStore } from '@nanostores/react';
import { $darkmode, setDarkmode } from '@stores/darkmodeStore';
import classNames from 'classnames';
import React from 'react';

import { Icon } from '../icon/Icon';
import styles from './DarkModeToggle.module.scss';
import headerStyles from './SiteHeader.module.scss';

export const DarkModeToggle = () => {
    const darkmode = useStore($darkmode);

    return (
        <li className={classNames(headerStyles.navItem, styles.navItem)}>
            <button
                className={classNames(styles.toggle, darkmode ? styles.dark : styles.light, 'button-style-none')}
                onClick={() => {
                    setDarkmode(!darkmode);
                }}
            >
                {darkmode ? <Icon name="sun" /> : <Icon name="moon" />}
            </button>
        </li>
    );
};
