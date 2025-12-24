import { Icon } from '@ag-website-shared/components/icon/Icon';
import type { HeroGalleryExample } from '@ag-website-shared/components/landing-pages/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './HeroGallery.module.scss';

interface Props {
    examples: HeroGalleryExample[];
    height: number;
    autoAdvanceDelay?: number;
    framework?: string;
}

export function HeroGallery({ examples, height, autoAdvanceDelay = 7000, framework = 'reactFunctional' }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const goToSlide = useCallback((index: number) => {
        setActiveIndex(index);
    }, []);

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => (prev === examples.length - 1 ? 0 : prev + 1));
    }, [examples.length]);

    // Auto-advance timer
    useEffect(() => {
        if (isPaused) return;

        timerRef.current = setInterval(() => {
            goToNext();
        }, autoAdvanceDelay);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPaused, autoAdvanceDelay, goToNext]);

    // Pause on hover
    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => !manualPause && setIsPaused(false);

    // Manual pause toggle
    const [manualPause, setManualPause] = useState(false);
    const togglePause = () => {
        setManualPause((prev) => !prev);
        setIsPaused((prev) => !prev);
    };

    const activeExample = examples[activeIndex];

    // Build iframe URL based on whether it's a gallery or docs example
    const getExampleUrl = (example: HeroGalleryExample) => {
        if (example.pageName) {
            // Docs example: /charts/{internalFramework}/{pageName}/examples/{exampleName}/
            return `/charts/${framework}/${example.pageName}/examples/${example.exampleName}/`;
        }
        // Gallery example: /charts/gallery/examples/{exampleName}/example-runner
        return `/charts/gallery/examples/${example.exampleName}/example-runner`;
    };

    return (
        <div className={styles.heroGallery} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Main gallery area */}
            <div className={styles.galleryContainer} style={{ height }}>
                {examples.map((example, index) => (
                    <div
                        key={example.exampleName}
                        className={`${styles.slide} ${index === activeIndex ? styles.active : ''}`}
                    >
                        {/* Only render iframe for active and adjacent slides for performance */}
                        {Math.abs(index - activeIndex) <= 1 ||
                        (activeIndex === 0 && index === examples.length - 1) ||
                        (activeIndex === examples.length - 1 && index === 0) ? (
                            <iframe
                                src={getExampleUrl(example)}
                                title={example.title}
                                className={`${styles.iframe} exampleRunner`}
                            />
                        ) : null}
                    </div>
                ))}
            </div>

            {/* Navigation controls */}
            <div className={styles.navigation}>
                <span className={styles.currentTitle}>{activeExample.title}</span>
                <div className={styles.dotsContainer}>
                    <div className={styles.dots}>
                        {examples.map((example, index) => (
                            <button
                                key={example.exampleName}
                                className={`${styles.dot} ${index === activeIndex ? styles.active : ''}`}
                                onClick={() => goToSlide(index)}
                                aria-label={`View ${example.title}`}
                            />
                        ))}
                    </div>
                    <button
                        className={styles.pauseButton}
                        onClick={togglePause}
                        aria-label={manualPause ? 'Resume slideshow' : 'Pause slideshow'}
                    >
                        <Icon name={manualPause ? 'play' : 'pause'} svgClasses={styles.pauseIcon} />
                    </button>
                </div>
            </div>
        </div>
    );
}
