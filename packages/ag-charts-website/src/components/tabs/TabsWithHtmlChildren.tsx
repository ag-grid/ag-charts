import { useLocation } from '@utils/navigation';
import { load } from 'cheerio';
import classnames from 'classnames';
import type { FunctionComponent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { TabNavItem } from './TabNavItem';
import styles from './Tabs.module.scss';
import { TAB_ID_PROP, TAB_ITEM_ID_PREFIX, TAB_LABEL_PROP } from './constants';

interface Props {
    children: ReactElement;
}

interface TabData {
    id?: string;
    label: string;
}

const getTabId = (id: string) => `${TAB_ITEM_ID_PREFIX}${id}`;

function useSelectTabFromLocationHash({
    tabsData,
    setSelected,
}: {
    tabsData: TabData[];
    setSelected: (tab: string) => void;
}) {
    const location = useLocation();

    useEffect(() => {
        const hash = location?.hash;
        if (!hash) {
            return;
        }
        const tab = tabsData.find((t) => getTabId(t.id!) === hash.slice(1));

        if (tab) {
            setSelected(tab.label);
        }
    }, [location, tabsData]);
}

/**
 * Tabs where the children are in a HTML string format
 *
 * Children content is parsed to determine what the tab content is
 */
export const TabsWithHtmlChildren: FunctionComponent<Props> = ({ children }) => {
    const $ = useMemo(() => load(children?.props.value, null, false), [children]);

    const location = useLocation();
    const [selected, setSelected] = useState<string>();
    const [tabContent, setTabContent] = useState<string>('');
    const [tabsData, setTabsData] = useState<TabData[]>([]);

    useSelectTabFromLocationHash({ tabsData, setSelected });

    useEffect(() => {
        const childrenTabLabels = $(`[${TAB_LABEL_PROP}]`)
            .map((_index: number, node: any) => {
                return {
                    id: node.attribs[TAB_ID_PROP],
                    label: node.attribs[TAB_LABEL_PROP],
                };
            })
            .toArray();

        setTabsData(childrenTabLabels);

        if (selected === undefined) {
            const initialTab =
                childrenTabLabels.find(
                    (child) => child.id && location?.hash.startsWith(`#${TAB_ITEM_ID_PREFIX}${child.id}`)
                ) ?? childrenTabLabels[0];
            setSelected(initialTab.label);
        }
    }, []);

    useEffect(() => {
        const childrenContent = $(`[${TAB_LABEL_PROP}="${selected}"]`).html() || '';
        setTabContent(childrenContent);
    }, [selected]);

    return (
        <div className={classnames('tabs-outer', styles.tabsOuter)}>
            <header className={'tabs-header'}>
                <ul className="tabs-nav-list" role="tablist">
                    {tabsData.map(({ id, label }) => {
                        return (
                            <TabNavItem
                                key={label}
                                tabId={getTabId(id!)}
                                label={label}
                                selected={label === selected}
                                onSelect={setSelected}
                            />
                        );
                    })}
                </ul>
            </header>
            <div
                className="tabs-content"
                role="tabpanel"
                aria-labelledby={`${selected} tab`}
                dangerouslySetInnerHTML={{ __html: tabContent }}
            ></div>
        </div>
    );
};
