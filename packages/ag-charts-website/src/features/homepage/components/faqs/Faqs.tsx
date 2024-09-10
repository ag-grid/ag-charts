import { Icon } from '@ag-website-shared/components/icon/Icon';
import React, { useState } from 'react';

import styles from './Faqs.module.scss';
import faqs from './faqs.json';

export const Faqs: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(-1);

    const handleToggle = (index: number) => {
        setActiveIndex(activeIndex === index ? -1 : index);
    };

    const midIndex = Math.ceil(faqs.length / 2);
    const firstColumnFaqs = faqs.slice(0, midIndex);
    const secondColumnFaqs = faqs.slice(midIndex);

    const linkMap = {
        'AG Grid Community':
            'https://www.ag-grid.com/react-data-grid/getting-started/?utm_source=charts-homepage&utm_medium=faqs',
        'AG Grid Enterprise': 'https://www.ag-grid.com/license-pricing/?utm_source=charts-homepage&utm_medium=faqs',
        'React Charts': 'https://www.ag-grid.com/charts/react/quick-start/?utm_source=charts-homepage&utm_medium=faqs',
        'JavaScript charts':
            'https://www.ag-grid.com/charts/javascript/quick-start/?utm_source=charts-homepage&utm_medium=faqs',
        'AG Grid': 'https://www.ag-grid.com/?utm_source=charts-homepage&utm_medium=faqs',
        'Pricing page': 'https://www.ag-grid.com/license-pricing/?utm_source=charts-homepage&utm_medium=faqs',
        themes: 'https://www.ag-grid.com/charts/react/themes/?utm_source=charts-homepage&utm_medium=faqs',
        'Theme Builder': 'https://www.ag-grid.com/theme-builder/?utm_source=charts-homepage&utm_medium=faqs',
        documentation: 'https://www.ag-grid.com/charts/react/quick-start/?utm_source=charts-homepage&utm_medium=faqs',
        tooltips: 'https://www.ag-grid.com/charts/react/tooltips/?utm_source=charts-homepage&utm_medium=faqs',
        zooming: 'https://www.ag-grid.com/charts/react/zoom/?utm_source=charts-homepage&utm_medium=faqs',
        panning: 'https://www.ag-grid.com/charts/react/navigator/?utm_source=charts-homepage&utm_medium=faqs',
        'context menus':
            'https://www.ag-grid.com/charts/react/context-menu/?utm_source=charts-homepage&utm_medium=faqs',
        'click events': 'https://localhost:4600/charts/react/events/?utm_source=charts-homepage&utm_medium=faqs',
        'export your charts': 'https://localhost:4600/charts/react/api-download',
        'AG Charts React':
            'https://www.ag-grid.com/charts/react/quick-start/?utm_source=charts-homepage&utm_medium=faqs',
        accessibility: 'https://www.ag-grid.com/charts/react/accessibility/?utm_source=charts-homepage&utm_medium=faqs',
        axes: 'https://www.ag-grid.com/charts/react/axes-types/?utm_source=charts-homepage&utm_medium=faqs',
        'series types': 'https://www.ag-grid.com/charts/gallery/?utm_source=charts-homepage&utm_medium=faqs',
        'real time':
            'https://blog.ag-grid.com/updating-bar-chart-in-real-time/?utm_source=charts-homepage&utm_medium=faqs',
    };

    // Function to update FAQ json with links
    const createLinkedText = (text: string, linkMap: Record<string, string>) => {
        const elements: React.ReactNode[] = [];
        const terms = Object.keys(linkMap);
        if (terms.length === 0) return [text];

        const pattern = new RegExp(`(${terms.map((term) => escapeRegExp(term)).join('|')})`, 'gi');
        function escapeRegExp(string: string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        const parts = text.split(pattern);
        parts.forEach((part, index) => {
            if (terms.includes(part)) {
                const url = linkMap[part];
                elements.push(
                    <a href={url} target="_blank" rel="noopener noreferrer" key={`${url}-${part}`}>
                        {part}
                    </a>
                );
            } else if (part) {
                elements.push(part);
            }
        });

        return elements;
    };

    return (
        <div className={styles.container}>
            <div className={styles.column}>
                {firstColumnFaqs.map((faq, index) => (
                    <React.Fragment key={index}>
                        <div className={styles.questionContainer} onClick={() => handleToggle(index)}>
                            <div className={styles.titleContainer}>
                                <span className={styles.question}>{faq.question}</span>
                                <Icon
                                    svgClasses={styles.expandIcon}
                                    name={activeIndex === index ? 'chevronDown' : 'chevronRight'}
                                />
                            </div>
                            {activeIndex === index && (
                                <div className={styles.answerContainer}>{createLinkedText(faq.answer, linkMap)}</div>
                            )}
                        </div>
                        <hr />
                    </React.Fragment>
                ))}
            </div>
            <div className={styles.column}>
                {secondColumnFaqs.map((faq, index) => (
                    <React.Fragment key={index + midIndex}>
                        <div className={styles.questionContainer} onClick={() => handleToggle(index + midIndex)}>
                            <div className={styles.titleContainer}>
                                <span className={styles.question}>{faq.question}</span>
                                <Icon
                                    svgClasses={styles.expandIcon}
                                    name={activeIndex === index + midIndex ? 'chevronDown' : 'chevronRight'}
                                />
                            </div>
                            {activeIndex === index + midIndex && (
                                <div className={styles.answerContainer}>{createLinkedText(faq.answer, linkMap)}</div>
                            )}
                        </div>
                        <hr />
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
