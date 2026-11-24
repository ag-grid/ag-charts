import type { InternalFramework } from '@ag-grid-types';
import { useTabList } from '@ag-website-shared/components/tabs/useTabList';
import { TrialButton } from '@ag-website-shared/components/trial-licence-modal/TrialButton';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { useSyncFrameworkStoreState } from '@utils/hooks/useSyncFrameworkStoreState';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './FeaturesWithExamples.module.scss';
import { FEATURES_PANEL_ID, getFeatureTabId } from './constants';

export interface FeatureItem {
    heading: string;
    detail: string;
    link?: string;
}

export interface FeatureConfig {
    id: string;
    title: string;
    isEnterprise?: boolean;
    example: {
        pageName: string;
        exampleName: string;
    };
    features: FeatureItem[];
    docsLink: string;
}

interface FeaturesWithExamplesContentProps {
    features: FeatureConfig[];
    framework: InternalFramework;
    /** Make the page's framework the visitor's selected framework. Only for pages specific to a framework. */
    syncFramework?: boolean;
}

const FrameworkStoreSync: React.FC<{ framework: InternalFramework }> = ({ framework }) => {
    useSyncFrameworkStoreState(getFrameworkFromInternalFramework(framework));

    return null;
};

export const FeaturesWithExamplesContent: React.FC<FeaturesWithExamplesContentProps> = ({
    features,
    framework,
    syncFramework = false,
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [contentTarget, setContentTarget] = useState<HTMLElement | null>(null);

    // Find the content target element for the portal
    useEffect(() => {
        const target = document.getElementById('landing-page-features-content-target');
        if (target) {
            setContentTarget(target);
        }
    }, []);

    const handleTabClick = (index: number) => {
        setActiveTab(index);

        // Dispatch custom event to notify Astro about tab change
        const event = new CustomEvent('landing-page-feature-tab-change', {
            detail: {
                index,
                featureId: features[index].id,
            },
        });
        document.dispatchEvent(event);
    };

    // Set initial tab on mount
    useEffect(() => {
        const event = new CustomEvent('landing-page-feature-tab-change', {
            detail: {
                index: 0,
                featureId: features[0]?.id,
            },
        });
        document.dispatchEvent(event);
    }, [features]);

    const { tablistProps, getTabProps } = useTabList({
        count: features.length,
        selectedIndex: activeTab,
        onSelect: handleTabClick,
        getTabId: (index) => getFeatureTabId(features[index].id),
        getPanelId: () => FEATURES_PANEL_ID,
        externalPanels: true,
    });

    const activeFeature = features.at(activeTab);

    const featureContent =
        activeFeature == null ? null : (
            <div className={styles.contentContainer}>
                <div className={styles.featureContainer}>
                    <h3 className={styles.title}>{activeFeature.title}</h3>
                    {activeFeature.features.map((feature, index) => (
                        <div key={index} className={styles.feature}>
                            <h5 className={styles.featureHeading}>{feature.heading}</h5>
                            <span className={styles.featureDetail}>
                                {feature.link == null || feature.link === '' ? (
                                    feature.detail
                                ) : (
                                    <a href={urlWithBaseUrl(feature.link)}>{feature.detail}</a>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
                <div className={styles.buttonContainer}>
                    {activeFeature.isEnterprise ? (
                        <TrialButton
                            id="request-trial-licence"
                            className={`button-secondary ${styles.trialCta} plausible-event-name=landing-page-features-trial-cta`}
                        >
                            Start Free Trial
                        </TrialButton>
                    ) : (
                        <a
                            id="get-started"
                            href={urlWithBaseUrl(`${activeFeature.docsLink}`)}
                            className={`button-secondary ${styles.trialCta} plausible-event-name=landing-page-features-get-started-cta`}
                        >
                            Get Started
                        </a>
                    )}
                </div>
            </div>
        );

    return (
        <>
            {syncFramework && <FrameworkStoreSync framework={framework} />}
            <div className={styles.tabContainer} {...tablistProps}>
                {features.map((feature, index) => (
                    <button
                        key={feature.id}
                        className={`${activeTab === index ? styles.activeTab : styles.tab} plausible-event-name=landing-page-${feature.id}-tab`}
                        {...getTabProps(index)}
                    >
                        {feature.title}
                    </button>
                ))}
            </div>
            {contentTarget ? createPortal(featureContent, contentTarget) : featureContent}
        </>
    );
};

export default FeaturesWithExamplesContent;
