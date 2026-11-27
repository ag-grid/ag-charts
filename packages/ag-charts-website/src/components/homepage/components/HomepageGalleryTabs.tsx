import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import { useTabList } from '@ag-website-shared/components/tabs/useTabList';
import { useState } from 'react';

import {
    HOMEPAGE_GALLERY_PANEL_ID,
    HOMEPAGE_GALLERY_SELECT_EVENT,
    HOMEPAGE_GALLERY_TABLIST_ID,
    getHomepageGalleryTabId,
} from '../constants';
import styles from './HomepageGalleryExamples.module.scss';

interface Props {
    examples: Array<{ id: string; buttonText: string; icon: IconName }>;
    initialExampleId: string;
}

export const HomepageGalleryTabs = ({ examples, initialExampleId }: Props) => {
    const [selectedIndex, setSelectedIndex] = useState(() =>
        Math.max(
            examples.findIndex(({ id }) => id === initialExampleId),
            0
        )
    );

    const { tablistProps, getTabProps } = useTabList({
        count: examples.length,
        selectedIndex,
        onSelect: (index) => {
            setSelectedIndex(index);
            document.dispatchEvent(
                new CustomEvent(HOMEPAGE_GALLERY_SELECT_EVENT, { detail: { exampleId: examples[index].id } })
            );
        },
        getTabId: (index) => getHomepageGalleryTabId(examples[index].id),
        getPanelId: () => HOMEPAGE_GALLERY_PANEL_ID,
        externalPanels: true,
    });

    return (
        <div className={styles.tabContainer} id={HOMEPAGE_GALLERY_TABLIST_ID} {...tablistProps}>
            {examples.map(({ id, buttonText, icon }, index) => (
                <button key={id} className={styles.tabButton} data-example-id={id} {...getTabProps(index)}>
                    <Icon svgClasses={styles.tabButtonIcon} name={icon} />
                    {buttonText}
                </button>
            ))}
        </div>
    );
};
