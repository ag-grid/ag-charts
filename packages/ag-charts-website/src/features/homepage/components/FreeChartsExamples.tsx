import { GalleryExampleRunner } from '@features/gallery/components/GalleryExampleRunner';
import React, { useState } from 'react';

import styles from './FreeChartsExamples.module.scss';

const examples = [
    {
        buttonLabel: 'Bar',
        exampleName: 'simple-bar',
    },
    {
        buttonLabel: 'Line',
        exampleName: 'simple-line',
    },
    {
        buttonLabel: 'Area',
        exampleName: 'simple-area',
    },
    {
        buttonLabel: 'Scatter',
        exampleName: 'simple-scatter',
    },
    {
        buttonLabel: 'Bubble',
        exampleName: 'simple-bubble',
    },
    {
        buttonLabel: 'Pie',
        exampleName: 'simple-pie',
    },
    {
        buttonLabel: 'Donut',
        exampleName: 'simple-donut',
    },
];

export const FreeChartsExamples: React.FC = () => {
    const [activeExample, setActiveExample] = useState(examples[0].exampleName);

    return (
        <div className={styles.container}>
            <div className={styles.tabContainer}>
                {examples.map((example) => (
                    <button
                        key={example.exampleName}
                        className={`${styles.tabButton} ${activeExample === example.exampleName ? styles.activeTabButton : ''}`}
                        onClick={() => setActiveExample(example.exampleName)}
                    >
                        {example.buttonLabel}
                    </button>
                ))}
            </div>
            <div className={styles.exampleContainer}>
                <GalleryExampleRunner
                    title={examples.find((ex) => ex.exampleName === activeExample)?.buttonLabel || 'Simple Bar'}
                    exampleName={activeExample}
                    loadingIFrameId={activeExample}
                />
            </div>
        </div>
    );
};
