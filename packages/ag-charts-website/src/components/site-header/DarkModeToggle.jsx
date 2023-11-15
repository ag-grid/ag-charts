import { useStore } from '@nanostores/react';
import { $darkmode, setDarkmode } from '@stores/darkmodeStore';
import classNames from 'classnames';
import React from 'react';

import { Icon } from '../icon/Icon';
import styles from './DarkModeToggle.module.scss';
import headerStyles from './SiteHeader.module.scss';

const useDarkmode = () => {
    const darkmode = useStore($darkmode);

    return darkmode === 'true' || darkmode === true;
};

export const DarkModeToggle = () => {
    const darkmode = useDarkmode();

    return (
        <li className={classNames(headerStyles.navItem, styles.navItem)}>
            <button
                className={classNames(styles.toggle, darkmode ? styles.dark : styles.light, 'button-style-none')}
                onClick={() => {
                    setDarkmode(!darkmode);
                    const darkModeEvent = {
                        type: 'color-scheme-change',
                        darkmode: !darkmode,
                    };

                    // post message for example runner to listen for user initiated color scheme changes
                    const iframes = document.querySelectorAll('.exampleRunner') || [];
                    iframes.forEach((iframe) => {
                        iframe.contentWindow.postMessage(darkModeEvent);
                    });

                    // Send on event on page for charts that are embeded on the page
                    window.dispatchEvent(new CustomEvent('message', { detail: darkModeEvent }));
                }}
            >
                {darkmode ? <Icon name="sun" /> : <Icon name="moon" />}
            </button>
        </li>
    );
};
