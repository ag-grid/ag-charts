import type { Framework, MenuData } from '@ag-grid-types';
import type { MenuItem } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { Collapsible } from '@components/Collapsible';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
// ag-grid menu styles
import gridStyles from '@legacy-design-system/modules/Menu.module.scss';
import styles from '@legacy-design-system/modules/PagesNavigation.module.scss';
import classnames from 'classnames';
import { useEffect, useState } from 'react';

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

function CollapsibleNav({
    id,
    items,
    framework,
    isOpen,
    activeMenuItem,
}: {
    id?: string;
    items: MenuItem[];
    framework: Framework;
    isOpen: boolean;
    activeMenuItem?: MenuItem;
}) {
    return (
        <Collapsible id={id} isOpen={isOpen}>
            <ul className={classnames(gridStyles.menuGroup, 'list-style-none')}>
                {items.map((menuItem: any) => {
                    const { title, path, items, url, icon, isEnterprise } = menuItem;
                    const linkUrl = getLinkUrl({ framework, path, url });
                    const isActive = activeMenuItem?.path === path;
                    const childId = `${title}-${path}`;

                    return items ? (
                        <NavItemContainer
                            key={childId}
                            menuItem={menuItem}
                            framework={framework}
                            activeMenuItem={activeMenuItem}
                            // All sub nav menus (not top level) are open by default and can't be toggled open
                            isActive={true}
                            hideCollapsibleButton={true}
                        />
                    ) : (
                        <li key={childId}>
                            <a
                                href={linkUrl}
                                className={classnames({
                                    [gridStyles.activeMenuItem]: isActive,
                                })}
                            >
                                {icon && (
                                    <Icon
                                        name={icon}
                                        svgClasses={classnames(styles.menuIcon, { [styles.activeMenuIcon]: isActive })}
                                    />
                                )}
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

function NavItemContainer({
    framework,
    menuItem,
    isActive,
    toggleActive,
    activeMenuItem,
    hideCollapsibleButton,
}: {
    framework: Framework;
    menuItem: MenuItem;
    isActive: boolean;
    toggleActive?: () => void;
    activeMenuItem?: MenuItem;
    hideCollapsibleButton?: boolean;
}) {
    const { title, path, url, icon, isEnterprise, items } = menuItem;
    const linkUrl = getLinkUrl({ framework, path, url });

    return (
        <li key={url}>
            {items && !hideCollapsibleButton ? (
                <button
                    onClick={toggleActive}
                    tabIndex={0}
                    className={classnames(gridStyles.sectionHeader, 'button-style-none', {
                        [gridStyles.active]: isActive,
                        [styles.active]: isActive,
                    })}
                    aria-expanded={isActive}
                    aria-controls={`#${toElementId(title)}`}
                >
                    <Icon
                        name="chevronRight"
                        svgClasses={classnames(gridStyles.sectionIcon, {
                            [gridStyles.active]: isActive,
                        })}
                    />

                    {icon && <Icon name={icon} svgClasses={styles.menuIcon} />}
                    {title}
                    {isEnterprise && <EnterpriseIcon />}
                </button>
            ) : (
                <a
                    href={linkUrl}
                    className={classnames(gridStyles.sectionHeader, {
                        [gridStyles.activeMenuItem]: activeMenuItem === menuItem,
                        [styles.activeMenuItem]: activeMenuItem === menuItem,
                    })}
                >
                    {icon && <Icon name={icon} svgClasses={styles.menuIcon} />}
                    {title}
                    {isEnterprise && <EnterpriseIcon />}
                </a>
            )}

            {items && (
                <CollapsibleNav items={items} framework={framework} isOpen={isActive} activeMenuItem={activeMenuItem} />
            )}
        </li>
    );
}

const createIsTopLevelPath = (activeMenuItemPath: string) => {
    const findPath = ({ path, items }: MenuItem) => {
        return path === activeMenuItemPath || items?.some(findPath);
    };
    return findPath;
};

function findActiveTopLevelMenuItem({
    menuData,
    activeMenuItemPath,
}: {
    menuData: MenuData;
    activeMenuItemPath: string;
}) {
    const isTopLevelPath = createIsTopLevelPath(activeMenuItemPath);
    return (
        menuData.main.items.find(isTopLevelPath) ||
        menuData.financialCharts.items.find(isTopLevelPath) ||
        menuData.maps.items.find(isTopLevelPath) ||
        menuData.charts.items.find(isTopLevelPath) ||
        menuData.misc.items.find(isTopLevelPath)
    );
}

function findActiveMenuItem({ menuData, activeMenuItemPath }: { menuData: MenuData; activeMenuItemPath: string }) {
    const getMenuItemReducer = (foundMenuItem: MenuItem | undefined, menuItem: MenuItem): MenuItem | undefined => {
        const { path, items } = menuItem;
        if (path === activeMenuItemPath) {
            return menuItem;
        }
        const childMenuItem = items?.reduce(getMenuItemReducer, undefined);

        return childMenuItem ? childMenuItem : foundMenuItem;
    };

    for (const key of ['main', 'maps', 'charts', 'financialCharts', 'misc'] as const) {
        const result = menuData[key].items.reduce<MenuItem | undefined>(getMenuItemReducer, undefined);
        if (result) {
            return result;
        }
    }

    return undefined;
}

function MenuHeader({ title }: { title: string }) {
    return (
        <>
            <hr />
            <h5>{title}</h5>
        </>
    );
}

function MenuNavigation({
    menuData,
    framework,
    menuGroupKey,
    activeMenuItem,
    activeTopLevelMenuItem,
    setActiveTopLevelMenuItem,
    header,
}: {
    menuData: MenuData;
    framework: Framework;
    menuGroupKey: keyof MenuData;
    activeMenuItem?: MenuItem;
    activeTopLevelMenuItem?: MenuItem;
    setActiveTopLevelMenuItem: (menuItem?: MenuItem) => void;
    header?: JSX.Element;
}) {
    const mainMenuItems = menuData[menuGroupKey].items;

    return (
        <ul className={classnames(styles.menuInner, gridStyles.menuInner, 'list-style-none')}>
            {header}
            {mainMenuItems?.map((menuItem) => {
                const { title, path } = menuItem;
                const isActive = menuItem === activeTopLevelMenuItem;

                const toggleActive = () => {
                    setActiveTopLevelMenuItem(isActive ? undefined : menuItem);
                };

                return (
                    <NavItemContainer
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

function MenuGroupPagesNavigation({
    menuData,
    framework,
    activeMenuItem,
    activeTopLevelMenuItem,
    menuGroupKey,
    className,
}: {
    menuData: MenuData;
    framework: Framework;
    activeMenuItem?: MenuItem;
    activeTopLevelMenuItem?: MenuItem;
    menuGroupKey: keyof MenuData;
    className: CSSModuleClasses[string];
}) {
    const [topLevelSeriesItem] = menuData[menuGroupKey].items;
    const chartsMenuItems = topLevelSeriesItem.items;

    return (
        <ul
            className={classnames(
                className,
                styles.menuInner,
                gridStyles.menuInner,
                gridStyles.menuGroup,
                'list-style-none'
            )}
        >
            <MenuHeader title={topLevelSeriesItem.title} />
            {chartsMenuItems?.map((menuItem) => {
                const { title, path } = menuItem;
                const isActive = menuItem === activeTopLevelMenuItem;

                return (
                    <NavItemContainer
                        key={`${title}-${path}`}
                        framework={framework}
                        menuItem={menuItem}
                        isActive={isActive}
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
    const [activeTopLevelMenuItem, setActiveTopLevelMenuItem] = useState<MenuItem | undefined>(
        findActiveTopLevelMenuItem({
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

    const [navOpen, setNavOpen] = useState(false);

    useEffect(() => {
        const docsButtonEl = document.querySelector('#top-bar-docs-button');

        const docsButtonHandler = () => {
            setNavOpen(!navOpen);
        };

        docsButtonEl?.addEventListener('click', docsButtonHandler);

        return () => {
            docsButtonEl?.removeEventListener('click', docsButtonHandler);
        };
    }, [navOpen]);

    return (
        <Collapsible id="docs-nav-collapser" isOpen={navOpen}>
            <aside className={classnames(styles.menu, gridStyles.menu)}>
                <div className={styles.whatsNewLink}>
                    <a href="/whats-new">What's New</a>
                </div>
                <MenuNavigation
                    menuData={menuData}
                    framework={framework}
                    menuGroupKey="main"
                    activeMenuItem={activeMenuItem}
                    activeTopLevelMenuItem={activeTopLevelMenuItem}
                    setActiveTopLevelMenuItem={setActiveTopLevelMenuItem}
                />
                <MenuGroupPagesNavigation
                    menuData={menuData}
                    framework={framework}
                    activeMenuItem={activeMenuItem}
                    activeTopLevelMenuItem={activeTopLevelMenuItem}
                    menuGroupKey="maps"
                    className={styles.menuGroupTypesNav}
                />
                <MenuGroupPagesNavigation
                    menuData={menuData}
                    framework={framework}
                    activeMenuItem={activeMenuItem}
                    activeTopLevelMenuItem={activeTopLevelMenuItem}
                    menuGroupKey="financialCharts"
                    className={styles.menuGroupTypesNav}
                />
                <MenuGroupPagesNavigation
                    menuData={menuData}
                    framework={framework}
                    activeMenuItem={activeMenuItem}
                    activeTopLevelMenuItem={activeTopLevelMenuItem}
                    menuGroupKey="charts"
                    className={styles.seriesTypesNav}
                />
                <MenuNavigation
                    menuData={menuData}
                    framework={framework}
                    menuGroupKey="misc"
                    activeMenuItem={activeMenuItem}
                    activeTopLevelMenuItem={activeTopLevelMenuItem}
                    setActiveTopLevelMenuItem={setActiveTopLevelMenuItem}
                    header={<MenuHeader title="Miscellaneous" />}
                />
            </aside>
        </Collapsible>
    );
}
