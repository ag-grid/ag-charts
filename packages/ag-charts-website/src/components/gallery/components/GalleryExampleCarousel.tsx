import { Icon } from '@ag-website-shared/components/icon/Icon';
import { type FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

import styles from './GalleryExampleCarousel.module.scss';
import { GalleryExampleLink } from './GalleryExampleLink';

interface Props {
    examples: { label: string; name: string }[];
    enableDprScaling: boolean;
    /** Names the strip for assistive technology, matching the heading above it. */
    label: string;
}

/** Fractional track widths leave a sub-pixel remainder at either end of the scroll range. */
const SCROLL_END_EPSILON = 1;

export const GalleryExampleCarousel: FunctionComponent<Props> = ({ examples, enableDprScaling, label }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [canScrollBack, setCanScrollBack] = useState(false);
    const [canScrollOn, setCanScrollOn] = useState(false);

    const syncScrollState = useCallback(() => {
        const track = trackRef.current;
        if (!track) {
            return;
        }
        setCanScrollBack(track.scrollLeft > SCROLL_END_EPSILON);
        setCanScrollOn(track.scrollWidth - track.clientWidth - track.scrollLeft > SCROLL_END_EPSILON);
    }, []);

    // Slides are a fixed width, so only the track's own width moves the scroll range. The
    // observer's initial callback doubles as the mount-time measurement.
    useEffect(() => {
        const track = trackRef.current;
        if (!track) {
            return;
        }
        const observer = new ResizeObserver(syncScrollState);
        observer.observe(track);
        return () => observer.disconnect();
    }, [syncScrollState]);

    const scrollByPage = (direction: 1 | -1) => {
        const track = trackRef.current;
        if (!track) {
            return;
        }
        track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
    };

    return (
        <div className={styles.carousel}>
            <button
                type="button"
                className={styles.control}
                onClick={() => scrollByPage(-1)}
                disabled={!canScrollBack}
                aria-label="Scroll to previous examples"
            >
                <Icon name="chevronLeft" />
            </button>

            <div
                className={styles.track}
                ref={trackRef}
                onScroll={syncScrollState}
                // Keyboard-scrollable, so it has to be reachable and named.
                tabIndex={0}
                role="group"
                aria-label={label}
            >
                {examples.map(({ label: exampleLabel, name }) => (
                    <GalleryExampleLink
                        key={name}
                        label={exampleLabel}
                        exampleName={name}
                        enableDprScaling={enableDprScaling}
                        layout="thumbnail"
                    />
                ))}
            </div>

            <button
                type="button"
                className={styles.control}
                onClick={() => scrollByPage(1)}
                disabled={!canScrollOn}
                aria-label="Scroll to more examples"
            >
                <Icon name="chevronRight" />
            </button>
        </div>
    );
};
