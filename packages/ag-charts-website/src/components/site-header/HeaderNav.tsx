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

const links = [
    {
        name: 'Gallery',
        url: pathJoin({ path: [SITE_BASE_URL, 'gallery'], addTrailingSlash: true }),
    },
    {
        name: 'Docs',
        url: pathJoin({ path: [SITE_BASE_URL, 'documentation'], addTrailingSlash: true }),
    },
    {
        name: 'API',
        url: pathJoin({ path: [SITE_BASE_URL, 'options'], addTrailingSlash: true }),
    },
    {
        name: 'Blog',
        url: 'https://blog.ag-grid.com/',
    },
    {
        name: 'Pricing',
        url: 'https://ag-grid.com/license-pricing/',
    },
    {
        name: 'Github',
        url: 'https://github.com/ag-grid/ag-grid',
        icon: <Icon name="github" />,
        cssClass: 'github-item',
    },
];

const getCurrentPageName = (path) => {
    const rawPath = path.split('/')[1];

    const allLinks = [
        ...links,
        ...FRAMEWORKS.map((framework) => ({
            name: 'Documentation',
            url: `${SITE_BASE_URL}${framework}-data-grid`,
        })),
    ];

    const match = allLinks.filter((link) => link.url.includes(rawPath));

    if (match && match.length === 1) {
        return match[0].name;
    }
};

const HeaderLinks = ({ path, isOpen, toggleIsOpen }) => {
    return (
        <ul className={classnames(styles.navItemList, 'list-style-none')}>
            {links.map((link) => {
                const linkClasses = classnames(styles.navItem, {
                    [styles.navItemActive]: link.name === getCurrentPageName(path),
                    [styles[link.cssClass]]: link.cssClass,
                });

                return (
                    <li key={link.name.toLocaleLowerCase()} className={linkClasses}>
                        <a
                            className={styles.navLink}
                            href={link.url}
                            onClick={() => {
                                if (isOpen) {
                                    toggleIsOpen();
                                }
                            }}
                            aria-label={`AG Grid ${link.name}`}
                        >
                            {link.icon}
                            <span>{link.name}</span>
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

export const HeaderNav = ({ path }) => {
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
                    <HeaderLinks path={path} isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
                </nav>
            </Collapsible>
        </>
    );
};
