import { useState } from 'react';
import classnames from 'classnames';
import styles from './PagesNavigation.module.scss';
import { Icon } from '@components/icon/Icon';
import type { Framework, MenuData } from '@ag-grid-types';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import { Collapsible } from '@components/Collapsible';
import type { MenuItem } from '@ag-grid-types';

function toElementId(str: string) {
    return 'menu-' + str.toLowerCase().replace('&', '').replace('/', '').replaceAll(' ', '-');
}

function getLinkUrl({ framework, path, url }: { framework: Framework; path?: string; url?: string }) {
    return url ? url : getExamplePageUrl({ framework, path: path! });
}

function EnterpriseIcon() {
    return (
        <span className={styles.enterpriseIcon}>
            (e)
            <Icon name="enterprise" />
        </span>
    );
}

function Level2Nav({
    id,
    items,
    framework,
    isOpen,
    activeMenuItem,
}: {
    id: string;
    items: MenuItem[];
    framework: Framework;
    isOpen: boolean;
    activeMenuItem?: MenuItem;
}) {
    return (
        <Collapsible id={id} isOpen={isOpen}>
            <ul className={classnames(styles.navGroup, 'list-style-none')}>
                {items.map(({ title, path, url, icon, isEnterprise }: any) => {
                    const linkUrl = getLinkUrl({ framework, path, url });
                    const isActive = activeMenuItem?.path === path;

                    return (
                        <li key={`${title}-${path}`}>
                            <a
                                href={linkUrl}
                                className={classnames({
                                    [styles.activeMenuItem]: isActive,
                                })}
                            >
                                {icon && <Icon name={icon} svgClasses={styles.menuIcon} />}
                                {title}
                                {isEnterprise && <EnterpriseIcon />}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </Collapsible>
    );
}

function Level1Nav({
    framework,
    menuItem,
    isActive,
    toggleActive,
    activeMenuItem,
}: {
    framework: Framework;
    menuItem: MenuItem;
    isActive: boolean;
    toggleActive: () => void;
    activeMenuItem?: MenuItem;
}) {
    const { title, path, url, icon, isEnterprise, items } = menuItem;
    const linkUrl = getLinkUrl({ framework, path, url });

    return (
        <li key={url} className={styles.navGroup}>
            {items ? (
                <button
                    onClick={toggleActive}
                    tabIndex={0}
                    className={classnames(styles.sectionHeader, 'button-style-none', {
                        [styles.active]: isActive,
                    })}
                    aria-expanded={isActive}
                    aria-controls={`#${toElementId(title)}`}
                >
                    <Icon
                        name="chevronRight"
                        svgClasses={classnames(styles.sectionIcon, {
                            [styles.active]: isActive,
                        })}
                    />

                    {icon && <Icon name={icon} svgClasses={styles.menuIcon} />}
                    {title}
                    {isEnterprise && <EnterpriseIcon />}
                </button>
            ) : (
                <a
                    href={linkUrl}
                    className={classnames(styles.sectionHeader, {
                        [styles.activeMenuItem]: activeMenuItem === menuItem,
                    })}
                >
                    {icon && <Icon name={icon} svgClasses={styles.menuIcon} />}
                    {title}
                    {isEnterprise && <EnterpriseIcon />}
                </a>
            )}

            {items && (
                <Level2Nav
                    id={(path || url)!}
                    items={items}
                    framework={framework}
                    isOpen={isActive}
                    activeMenuItem={activeMenuItem}
                />
            )}
        </li>
    );
}

function findActiveLevel1MenuItem({
    menuData,
    activeMenuItemPath,
}: {
    menuData: MenuData;
    activeMenuItemPath: string;
}) {
    const findPath = ({ path, items }: MenuItem) => {
        return items
            ? items.some(({ path }) => {
                  return path === activeMenuItemPath;
              })
            : path === activeMenuItemPath;
    };
    return menuData.main.items.find(findPath) || menuData.charts.items.find(findPath);
}

function findActiveMenuItem({ menuData, activeMenuItemPath }: { menuData: MenuData; activeMenuItemPath: string }) {
    const getMenuItemReducer = (foundMenuItem: MenuItem | undefined, menuItem: MenuItem) => {
        const { path, items } = menuItem;
        if (!items && path === activeMenuItemPath) {
            return menuItem;
        }
        const childMenuItem = items?.find(({ path }) => {
            return path === activeMenuItemPath;
        });

        return childMenuItem ? childMenuItem : foundMenuItem;
    };

    return (
        menuData.main.items.reduce<MenuItem | undefined>(getMenuItemReducer, undefined) ||
        menuData.charts.items.reduce<MenuItem | undefined>(getMenuItemReducer, undefined)
    );
}

function MainPagesNavigation({
    menuData,
    framework,
    activeMenuItem,
    activeLevel1MenuItem,
    setActiveLevel1MenuItem,
}: {
    menuData: MenuData;
    framework: Framework;
    activeMenuItem?: MenuItem;
    activeLevel1MenuItem?: MenuItem;
    setActiveLevel1MenuItem: (menuItem?: MenuItem) => void;
}) {
    const mainMenuItems = menuData.main.items;
    return (
        <ul className={classnames('list-style-none', styles.navInner)}>
            {mainMenuItems?.map((menuItem) => {
                const { title, path } = menuItem;
                const isActive = menuItem === activeLevel1MenuItem;

                const toggleActive = () => {
                    setActiveLevel1MenuItem(isActive ? undefined : menuItem);
                };

                return (
                    <Level1Nav
                        key={`${title}-${path}`}
                        framework={framework}
                        menuItem={menuItem}
                        isActive={isActive}
                        toggleActive={toggleActive}
                        activeMenuItem={activeMenuItem}
                    />
                );
            })}
        </ul>
    );
}

function ChartPagesNavigation({
    menuData,
    framework,
    activeMenuItem,
    activeLevel1MenuItem,
    setActiveLevel1MenuItem,
}: {
    menuData: MenuData;
    framework: Framework;
    activeMenuItem?: MenuItem;
    activeLevel1MenuItem?: MenuItem;
    setActiveLevel1MenuItem: (menuItem?: MenuItem) => void;
}) {
    const chartsMenuItems = menuData.charts.items;

    return (
        <ul className={classnames('list-style-none', styles.navInner, styles.chartTypesNav)}>
            {chartsMenuItems?.map((menuItem) => {
                const { title, path } = menuItem;
                const isActive = menuItem === activeLevel1MenuItem;

                const toggleActive = () => {
                    setActiveLevel1MenuItem(isActive ? undefined : menuItem);
                };

                return (
                    <Level1Nav
                        key={`${title}-${path}`}
                        framework={framework}
                        menuItem={menuItem}
                        isActive={isActive}
                        toggleActive={toggleActive}
                        activeMenuItem={activeMenuItem}
                    />
                );
            })}
        </ul>
    );
}

export function PagesNavigation({
    menuData,
    framework,
    pageName,
}: {
    menuData: MenuData;
    framework: Framework;
    pageName: string;
}) {
    const [activeLevel1MenuItem, setActiveLevel1MenuItem] = useState<MenuItem | undefined>(
        findActiveLevel1MenuItem({
            menuData,
            activeMenuItemPath: pageName,
        })
    );
    const [activeMenuItem] = useState<MenuItem | undefined>(
        findActiveMenuItem({
            menuData,
            activeMenuItemPath: pageName,
        })
    );

    return (
        <aside className={classnames(styles.nav, 'font-size-responsive')}>
            <MainPagesNavigation
                menuData={menuData}
                framework={framework}
                activeMenuItem={activeMenuItem}
                activeLevel1MenuItem={activeLevel1MenuItem}
                setActiveLevel1MenuItem={setActiveLevel1MenuItem}
            />
            <ChartPagesNavigation
                menuData={menuData}
                framework={framework}
                activeMenuItem={activeMenuItem}
                activeLevel1MenuItem={activeLevel1MenuItem}
                setActiveLevel1MenuItem={setActiveLevel1MenuItem}
            />
        </aside>
    );
}
