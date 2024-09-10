import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import { GalleryExampleRunner } from '@features/gallery/components/GalleryExampleRunner';
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
    loadingIFrameId: string;
}

export const HomepageGalleryExamples = ({ examples, loadingIFrameId }: Props) => {
    const [currentExampleName, setCurrentExampleName] = useState(examples[0].exampleName);
    const currentExample = examples.find((example) => example.exampleName === currentExampleName) || examples[0];
    const { title, exampleName } = currentExample;

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
