import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import LoadingLogo from '@ag-website-shared/images/inline-svgs/ag-grid-logomark-loading.svg?react';
import { getLoadingIFrameId, getLoadingLogoId } from '@features/example-runner/utils/getLoadingLogoId';
import { onMessageRemoveLoadingLogo } from '@features/example-runner/utils/onMessageRemoveLoadingLogo';
import { GalleryExampleRunner } from '@features/gallery/components/GalleryExampleRunner';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { useEffect, useState } from 'react';

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
    const currentExample = examples.find((example) => example.exampleName === currentExampleName) || examples[0];
    const { title, exampleName } = currentExample;
    const loadingLogoId = getLoadingLogoId({ pageName, exampleName });
    const loadingIFrameId = getLoadingIFrameId({ pageName, exampleName });

    useEffect(() => {
        const { cleanUp } = onMessageRemoveLoadingLogo({ pageName, exampleName });

        return cleanUp;
    }, [pageName, exampleName]);

    const handleExampleSelect = (exampleName: string) => {
        setCurrentExampleName(exampleName);
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
                <LoadingLogo id={loadingLogoId} />
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
