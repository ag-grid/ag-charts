import classnames from 'classnames';
import type { FunctionComponent, ReactElement, ReactNode } from 'react';
import { useState } from 'react';

import { TabItem } from './TabItem';
import styles from './Tabs.module.scss';

const TAB_LABEL_PROP = 'tab-label'; // NOTE: kebab case to match markdown html props
const TABS_LINKS_PROP = 'tabs-links';

interface Props {
    children: ReactNode;
}

export const Tabs: FunctionComponent<Props> = ({ children }) => {
    const contentChildren = (children as ReactElement[])?.filter((child) => child.props && child.props[TAB_LABEL_PROP]);
    const linksChildren = (children as ReactElement[])?.filter((child) => child.props && child.props[TABS_LINKS_PROP]);

    const [selected, setSelected] = useState(contentChildren[0]?.props[TAB_LABEL_PROP]);

    return (
        <div className={classnames('tabs-outer', styles.tabsOuter)}>
            <header className={'tabs-header'}>
                <ul className="tabs-nav-list" role="tablist">
                    {contentChildren.map(({ props }: ReactElement) => {
                        const label = props[TAB_LABEL_PROP];
                        return <TabItem label={label} selected={selected} setSelected={setSelected} />;
                    })}
                </ul>

                {linksChildren && <div className={styles.externalLinks}>{linksChildren}</div>}
            </header>
            <div className="tabs-content" role="tabpanel" aria-labelledby={`${selected} tab`}>
                {contentChildren.find(({ props }: ReactElement) => props[TAB_LABEL_PROP] === selected)}
            </div>
        </div>
    );
};
