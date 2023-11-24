import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';

import { Icon } from '../icon/Icon';
import gridHeaderStyles from './gridSiteHeader.module.scss';

export const DarkModeToggle = () => {
    const [darkmode, baseSetDarkmode] = useState<boolean>();

    const setDarkmode = useCallback((nextDarkmode: boolean) => {
        baseSetDarkmode(nextDarkmode);
        document.documentElement.dataset.darkMode = String(nextDarkmode);

        const darkModeEvent = { type: 'color-scheme-change', darkmode: nextDarkmode };

        // post message for example runner to listen for user initiated color scheme changes
        const iframes = document.querySelectorAll('.exampleRunner') || [];
        iframes.forEach((iframe) => {
            iframe.contentWindow.postMessage(darkModeEvent);
        });

        // Send on event on page for charts that are embeded on the page
        window.dispatchEvent(new CustomEvent('message', { detail: darkModeEvent }));
    }, []);

    useEffect(() => {
        setDarkmode(document.documentElement.dataset.darkMode === 'true');
    }, []);

    return (
        <li className={classNames(gridHeaderStyles.navItem, gridHeaderStyles.buttonItem)}>
            <button
                className={classNames(gridHeaderStyles.navLink, 'button-style-none')}
                onClick={() => setDarkmode(!darkmode)}
            >
                {darkmode ? <Icon name="sun" /> : <Icon name="moon" />}
            </button>
        </li>
    );
};
