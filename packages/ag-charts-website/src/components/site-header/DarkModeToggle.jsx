import { setDarkmode } from '@stores/darkmodeStore';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import classNames from 'classnames';
import React from 'react';

import { Icon } from '../icon/Icon';
import gridHeaderStyles from './gridSiteHeader.module.scss';

export const DarkModeToggle = () => {
    const darkmode = useDarkmode();

    return (
        <li className={classNames(gridHeaderStyles.navItem, gridHeaderStyles.buttonItem)}>
            <button
                className={classNames(gridHeaderStyles.navLink, 'button-style-none')}
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
