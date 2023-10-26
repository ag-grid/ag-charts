import { load } from 'cheerio';
import classnames from 'classnames';
import type { FunctionComponent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { TabItem } from './TabItem';
import styles from './Tabs.module.scss';
import { TAB_LABEL_PROP } from './constants';

interface Props {
    tabLabels: string[];
    children: ReactElement;
}

/**
 * Tabs where the children are in a HTML string format
 *
 * Children content is parsed to determine what the tab content is
 */
export const TabsWithHtmlChildren: FunctionComponent<Props> = ({ tabLabels = [], children }) => {
    const $ = useMemo(() => load(children?.props.value, null, false), [children]);

    const [selected, setSelected] = useState<string>(tabLabels[0]);
    const [tabContent, setTabContent] = useState<string>('');

    useEffect(() => {
        const childrenContent = $(`[${TAB_LABEL_PROP}="${selected}"]`).html() || '';
        setTabContent(childrenContent);
    }, [selected]);

    return (
        <div className={classnames('tabs-outer', styles.tabsOuter)}>
            <header className={'tabs-header'}>
                <ul className="tabs-nav-list" role="tablist">
                    {tabLabels.map((label) => {
                        return <TabItem key={label} label={label} selected={selected} setSelected={setSelected} />;
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
