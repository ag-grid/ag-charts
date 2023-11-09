import { navigate, useLocation } from '@utils/navigation';
import classnames from 'classnames';
import type { FunctionComponent, ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { TabNavItem } from './TabNavItem';
import styles from './Tabs.module.scss';
import { TAB_ID_PROP } from './constants';
import type { TabData } from './types';

interface Props {
    tabsData: TabData[];
    tabItemIdPrefix?: string;
    children: ReactElement;
}

const getTabId = ({ id, prefix }: { id: string; prefix?: string }) => `${prefix}${id}`;

function useSelectTabFromLocationHash({
    tabsData,
    setSelected,
    tabItemIdPrefix,
}: {
    tabsData: TabData[];
    setSelected: (tab: TabData) => void;
    tabItemIdPrefix?: string;
}) {
    const location = useLocation();

    useEffect(() => {
        const hash = location?.hash;
        if (!hash) {
            return;
        }

        const tab = tabsData.find((t) => hash.startsWith(`#${tabItemIdPrefix}${t.id}`));
        if (tab) {
            setSelected(tab);
        }
    }, [location, tabsData]);
}

/**
 * Show the selected HTML children content
 *
 * NOTE: Doing this in plain JavaScript instead of React because the Astro Markdoc
 * integration strips out JavaScript if the content is not present on the page
 */
function useShowHtmlChildrenContent({ selected }: { selected: TabData }) {
    useEffect(() => {
        document.querySelectorAll(`[${TAB_ID_PROP}]`).forEach((el) => ((el as HTMLElement).style.display = 'none'));

        const selectedTab = document.querySelector(`[${TAB_ID_PROP}="${selected.id}"]`);
        if (selectedTab) {
            (selectedTab as HTMLElement).style.display = 'block';
        }
    }, [selected]);
}

/**
 * Tabs where the children are in a HTML string format
 */
export const TabsWithHtmlChildren: FunctionComponent<Props> = ({ tabsData, tabItemIdPrefix, children }) => {
    const [selected, setSelected] = useState<TabData>(tabsData[0]);

    useSelectTabFromLocationHash({ tabsData, setSelected, tabItemIdPrefix });
    useShowHtmlChildrenContent({ selected });

    return (
        <div className={classnames('tabs-outer', styles.tabsOuter)}>
            <header className={'tabs-header'}>
                <ul className="tabs-nav-list" role="tablist">
                    {tabsData.map(({ id, label }) => {
                        const tabId = getTabId({ id: id!, prefix: tabItemIdPrefix });
                        return (
                            <TabNavItem
                                key={label}
                                tabId={tabId}
                                label={label}
                                selected={label === selected?.label}
                                onSelect={(selectedLabel) => {
                                    const tab = tabsData.find(({ label }) => label === selectedLabel);

                                    if (tab) {
                                        setSelected(tab);
                                        navigate(`#${tabId}`);
                                    }
                                }}
                            />
                        );
                    })}
                </ul>
            </header>
            <div
                className="tabs-content"
                role="tabpanel"
                aria-labelledby={`${selected.label} tab`}
                // NOTE: Need to set this dangerously, otherwise it is different on the
                // server and client side
                dangerouslySetInnerHTML={{ __html: children?.props.value }}
            />
        </div>
    );
};
