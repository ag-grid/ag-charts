import type { MenuItem } from '@ag-grid-types';
import { SITE_BASE_URL } from '@constants';
import { ReactComponent as MenuIcon } from '@images/inline-svgs/menu-icon.svg';
import { pathJoin } from '@utils/pathJoin';
import classnames from 'classnames';
import { useState } from 'react';

import { Collapsible } from '../Collapsible';
import { Icon } from '../icon/Icon';
import { DarkModeToggle } from './DarkModeToggle';
import styles from './HeaderNav.module.scss';
import gridStyles from './gridSiteHeader.module.scss';

const getCurrentPageName = ({ path, allPaths }: { path: string; allPaths: MenuItem[] }) => {
    const match = allPaths.find((link) => path.includes(link.path!));

    if (match) {
        return match.title;
    }
};

const HeaderLinks = ({
    currentPath,
    items,
    allPaths,
    isOpen,
    toggleIsOpen,
}: {
    currentPath: string;
    items: MenuItem[];
    allPaths: MenuItem[];
    isOpen?: boolean;
    toggleIsOpen?: () => void;
}) => {
    return (
        <ul className={classnames(gridStyles.navItemList, 'list-style-none')}>
            {items.map(({ title, path, url, icon }) => {
                const linkClasses = classnames(gridStyles.navItem, {
                    [gridStyles.navItemActive]: title === getCurrentPageName({ path: currentPath, allPaths }),
                    [gridStyles.buttonItem]: title === 'Github',
                    [gridStyles.githubItem]: title === 'Github',
                });
                const href = path ? pathJoin(SITE_BASE_URL, path) : url;

                return (
                    <li key={title.toLocaleLowerCase()} className={linkClasses}>
                        <a
                            className={gridStyles.navLink}
                            href={href}
                            onClick={() => {
                                if (isOpen) {
                                    toggleIsOpen && toggleIsOpen();
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

const HeaderExpandButton = ({ isOpen, toggleIsOpen }: { isOpen: boolean; toggleIsOpen: () => void }) => (
    <button
        className={gridStyles.mobileMenuButton}
        type="button"
        aria-controls={styles.mainNavSmall}
        aria-expanded={isOpen}
        aria-label="Toggle navigation"
        onClick={() => toggleIsOpen()}
    >
        <MenuIcon className={gridStyles.menuIcon} />
    </button>
);

const HeaderNavLarge = ({
    currentPath,
    items,
    allPaths,
}: {
    currentPath: string;
    items: MenuItem[];
    allPaths: MenuItem[];
}) => {
    return (
        <div className={styles.mainNavLargeContainer}>
            <nav className={styles.mainNavLarge}>
                <HeaderLinks currentPath={currentPath} items={items} allPaths={allPaths} />
            </nav>
        </div>
    );
};

const HeaderNavSmall = ({
    currentPath,
    items,
    allPaths,
    isOpen,
    toggleIsOpen,
}: {
    currentPath: string;
    items: MenuItem[];
    allPaths: MenuItem[];
    isOpen: boolean;
    toggleIsOpen: () => void;
}) => {
    return (
        <>
            <HeaderExpandButton isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
            <Collapsible id={styles.mainNavSmall} isOpen={isOpen}>
                <nav className={gridStyles.mainNav}>
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

export const HeaderNav = ({
    currentPath,
    items,
    allPaths,
}: {
    currentPath: string;
    items: MenuItem[];
    allPaths: MenuItem[];
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleIsOpen = () => {
        setIsOpen((currentIsOpen) => {
            return !currentIsOpen;
        });
    };

    return (
        <>
            <HeaderNavLarge currentPath={currentPath} items={items} allPaths={allPaths} />
            <HeaderNavSmall
                currentPath={currentPath}
                items={items}
                allPaths={allPaths}
                isOpen={isOpen}
                toggleIsOpen={toggleIsOpen}
            />
        </>
    );
};
