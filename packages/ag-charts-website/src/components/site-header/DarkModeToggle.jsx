import classNames from 'classnames';
import React from 'react';

// import GlobalContextConsumer from '../GlobalContext';
import { Icon } from '../icon/Icon';
import styles from './DarkModeToggle.module.scss';
import headerStyles from './SiteHeader.module.scss';

// const IS_SSR = typeof window === 'undefined';

export const DarkModeToggle = () => {
    // return IS_SSR ? null : (
    //     <GlobalContextConsumer>
    //         {({ darkMode, set }) => {
    //             const htmlEl = document.querySelector('html');

    //             // Using .no-transitions class so that there are no animations between light/dark modes
    //             htmlEl.classList.add('no-transitions');
    //             htmlEl.dataset.darkMode = darkMode ? 'true' : 'false';
    //             htmlEl.offsetHeight; // Trigger a reflow, flushing the CSS changes
    //             htmlEl.classList.remove('no-transitions');

    //             return (
    //                 <li className={classNames(headerStyles.navItem, styles.navItem)}>
    //                     <button
    //                         className={classNames(
    //                             styles.toggle,
    //                             darkMode ? styles.dark : styles.light,
    //                             'button-style-none'
    //                         )}
    //                         onClick={() => {
    //                             set({ darkMode: !darkMode });
    //                         }}
    //                     >
    //                         {darkMode ? <Icon name="sun" /> : <Icon name="moon" />}
    //                     </button>
    //                 </li>
    //             );
    //         }}
    //     </GlobalContextConsumer>
    // );

    let darkMode = true;

    return (
        <li className={classNames(headerStyles.navItem, styles.navItem)}>
            <button
                className={classNames(styles.toggle, darkMode ? styles.dark : styles.light, 'button-style-none')}
                // onClick={() => {
                //     setDarkmode();
                // }}
            >
                {darkMode ? <Icon name="sun" /> : <Icon name="moon" />}
            </button>
        </li>
    );
};
