import classnames from 'classnames';
import type { FunctionComponent, ReactElement } from 'react';
import { Children, useState } from 'react';

import { TabItem } from './TabItem';
import styles from './Tabs.module.scss';
import { TABS_LINKS_PROP, TAB_LABEL_PROP } from './constants';

interface Props {
    children: ReactElement[];
}

export const Tabs: FunctionComponent<Props> = ({ children }) => {
    const contentChildren = Children.map(children, (child) => {
        return child.props[TAB_LABEL_PROP] ? child : null;
    }).filter(Boolean);
    const headerLinks = Children.map(children, (child) => {
        return child.props[TABS_LINKS_PROP] ? child : null;
    }).filter(Boolean);

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

                {headerLinks && <div className={styles.externalLinks}>{headerLinks}</div>}
            </header>
            <div className="tabs-content" role="tabpanel" aria-labelledby={`${selected} tab`}>
                {contentChildren.find(({ props }: ReactElement) => props[TAB_LABEL_PROP] === selected)}
            </div>
        </div>
    );
};
