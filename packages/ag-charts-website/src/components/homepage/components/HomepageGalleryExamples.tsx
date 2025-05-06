import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import { LoadingLogo } from '@ag-website-shared/components/loading-logo/LoadingLogo';
import { getLoadingIFrameId } from '@ag-website-shared/components/loading-logo/getElementId';
import { GalleryExampleRunner } from '@components/gallery/components/GalleryExampleRunner';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { useState } from 'react';

import styles from './HomepageGalleryExamples.module.scss';

interface Props {
    examples: Array<{
        title: string;
        exampleName: string;
        buttonText: string;
        icon: string;
    }>;
    pageName: string;
}

export const HomepageGalleryExamples = ({ examples, pageName }: Props) => {
    const [currentExampleName, setCurrentExampleName] = useState(examples[0].exampleName);
    const currentExample = examples.find((example) => example.exampleName === currentExampleName) ?? examples[0];
    const { title, exampleName } = currentExample;
    const loadingIFrameId = getLoadingIFrameId({ pageName, exampleName });

    const handleExampleSelect = (name: string) => {
        setCurrentExampleName(name);
    };

    const footerChildren = (
        <a href={urlWithBaseUrl(`/gallery#${currentExample.buttonText.replace(' ', '-').toLowerCase()}`)}>
            View More {currentExample.buttonText} Chart Examples <Icon name="arrowRight" />
        </a>
    );

    return (
        <div className={styles.container}>
            <div className={styles.tabContainer}>
                {examples.map((example) => (
                    <button
                        key={example.exampleName}
                        className={`${styles.tabButton} ${example.exampleName === currentExampleName ? styles.activeTabButton : ''}`}
                        onClick={() => handleExampleSelect(example.exampleName)}
                    >
                        <Icon
                            svgClasses={`${example.exampleName === currentExampleName ? styles.activeTabButtonIcon : styles.tabButtonIcon}`}
                            name={example.icon as IconName}
                        />
                        {example.buttonText}
                    </button>
                ))}
            </div>
            <div className={styles.exampleContainer}>
                <LoadingLogo pageName={pageName} exampleName={exampleName} />
                <GalleryExampleRunner
                    title={title}
                    exampleName={exampleName}
                    loadingIFrameId={loadingIFrameId}
                    hideCode
                    hideExternalLinks
                    footerChildren={footerChildren}
                />
            </div>
        </div>
    );
};
