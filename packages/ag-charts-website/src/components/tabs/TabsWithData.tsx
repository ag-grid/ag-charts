import { navigate, useLocation } from '@utils/navigation';
import classnames from 'classnames';
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';

import { TabNavItem } from './TabNavItem';
import styles from './Tabs.module.scss';
import type { TabData } from './types';

interface Props {
    tabsData: TabData[];
    tabItemIdPrefix?: string;
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
 * Tabs where the children are in a HTML string format
 *
 * Children content is parsed to determine what the tab content is
 */
export const TabsWithData: FunctionComponent<Props> = ({ tabsData, tabItemIdPrefix }) => {
    const [selected, setSelected] = useState<TabData>(tabsData[0]);

    useSelectTabFromLocationHash({ tabsData, setSelected, tabItemIdPrefix });

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
                aria-labelledby={`${selected} tab`}
                dangerouslySetInnerHTML={{ __html: selected?.content ?? '' }}
            ></div>
        </div>
    );
};
