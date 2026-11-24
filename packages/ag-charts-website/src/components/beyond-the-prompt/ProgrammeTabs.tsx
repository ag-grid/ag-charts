import { useTabList } from '@ag-website-shared/components/tabs/useTabList';
import styles from '@pages-styles/beyond-the-prompt.module.scss';
import { useState } from 'react';

const PROGRAMME_TABS = [
    { id: 'talks', label: 'Talks' },
    { id: 'speakers', label: 'Speakers' },
] as const;

type ProgrammeTabId = (typeof PROGRAMME_TABS)[number]['id'];

export const getProgrammeTabId = (id: ProgrammeTabId) => `tab-${id}`;
export const getProgrammePanelId = (id: ProgrammeTabId) => `panel-${id}`;

export const ProgrammeTabs = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const { tablistProps, getTabProps } = useTabList({
        count: PROGRAMME_TABS.length,
        selectedIndex,
        onSelect: setSelectedIndex,
        getTabId: (index) => getProgrammeTabId(PROGRAMME_TABS[index].id),
        getPanelId: (index) => getProgrammePanelId(PROGRAMME_TABS[index].id),
        externalPanels: true,
    });

    return (
        <div className={styles.programmeTabs} aria-label="Programme" {...tablistProps}>
            {PROGRAMME_TABS.map(({ id, label }, index) => (
                <button key={id} className={styles.programmeTab} {...getTabProps(index)}>
                    {label}
                </button>
            ))}
        </div>
    );
};
