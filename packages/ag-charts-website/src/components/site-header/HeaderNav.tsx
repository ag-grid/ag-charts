import { FRAMEWORKS, SITE_BASE_URL } from '@constants';
import breakpoints from '@design-system/breakpoint.module.scss';
import { ReactComponent as MenuIcon } from '@images/inline-svgs/menu-icon.svg';
import { useWindowSize } from '@utils/hooks/useWindowSize';
import { pathJoin } from '@utils/pathJoin';
import classnames from 'classnames';
import { useState } from 'react';

import { Collapsible } from '../Collapsible';
import { Icon } from '../icon/Icon';
import { DarkModeToggle } from './DarkModeToggle';
import styles from './SiteHeader.module.scss';

const SITE_HEADER_SMALL_WIDTH = parseInt(breakpoints['site-header-small'], 10);

const getCurrentPageName = ({ path, allPaths }) => {
    const match = allPaths.find((link) => path.includes(link.path));

    if (match) {
        return match.title;
    }
};

const HeaderLinks = ({ currentPath, items, allPaths, isOpen, toggleIsOpen }) => {
    return (
        <ul className={classnames(styles.navItemList, 'list-style-none')}>
            {items.map(({ title, cssClass, path, url, icon }) => {
                const linkClasses = classnames(styles.navItem, {
                    [styles.navItemActive]: title === getCurrentPageName({ path: currentPath, allPaths }),
                    [styles[cssClass]]: cssClass,
                });
                const href = path ? pathJoin(SITE_BASE_URL, path) : url;

                return (
                    <li key={title.toLocaleLowerCase()} className={linkClasses}>
                        <a
                            className={styles.navLink}
                            href={href}
                            onClick={() => {
                                if (isOpen) {
                                    toggleIsOpen();
                                }
                            }}
                            aria-label={`AG Grid ${title}`}
                        >
                            {icon && <Icon name={icon} />}
                            <span>{title}</span>
                        </a>
                    </li>
                );
            })}

            <DarkModeToggle />
        </ul>
    );
};

const HeaderExpandButton = ({ isOpen, toggleIsOpen }) => (
    <button
        className={styles.mobileMenuButton}
        type="button"
        aria-controls="main-nav"
        aria-expanded={isOpen.toString()}
        aria-label="Toggle navigation"
        onClick={() => toggleIsOpen()}
    >
        <MenuIcon className={styles.menuIcon} />
    </button>
);

export const HeaderNav = ({ currentPath, items, allPaths }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { width } = useWindowSize();
    const isDesktop = width >= SITE_HEADER_SMALL_WIDTH;

    const toggleIsOpen = () => {
        setIsOpen((currentIsOpen) => {
            return !currentIsOpen;
        });
    };

    return (
        <>
            <HeaderExpandButton isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
            <Collapsible id="main-nav" isDisabled={isDesktop} isOpen={isOpen}>
                <nav id={isDesktop ? 'main-nav' : undefined}>
                    <HeaderLinks
                        currentPath={currentPath}
                        items={items}
                        allPaths={allPaths}
                        isOpen={isOpen}
                        toggleIsOpen={toggleIsOpen}
                    />
                </nav>
            </Collapsible>
        </>
    );
};
