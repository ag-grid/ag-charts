import { useLocation } from '@utils/navigation';
import { load } from 'cheerio';
import classnames from 'classnames';
import type { FunctionComponent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { TabNavItem } from './TabNavItem';
import styles from './Tabs.module.scss';
import { TAB_ID_PROP, TAB_LABEL_PROP } from './constants';

interface Props {
    children: ReactElement;
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
    const [tabsData, setTabsData] = useState<{ id?: string; label: string }[]>([]);

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
                childrenTabLabels.find((child) => child.id && location?.hash.startsWith(`#reference-${child.id}`)) ??
                childrenTabLabels[0];
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
                    {tabsData.map(({ label }) => {
                        return (
                            <TabNavItem
                                key={label}
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
