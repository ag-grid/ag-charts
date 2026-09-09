import { Icon } from '@ag-website-shared/components/icon/Icon';
import classnames from 'classnames';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import styles from './Carousel.module.scss';

interface Props {
    /**
     * One element per slide. Contents are entirely the caller's, as is each slide's width —
     * the track lays them out in a row and never stretches or shrinks them.
     */
    children: ReactNode;
    /** Names the scrollable region for assistive technology, usually the heading above it. */
    label: string;
    /** Accessible names for the controls, where the defaults are too vague for the context. */
    previousLabel?: string;
    nextLabel?: string;
    /** Prev/next buttons either side of the track. */
    showControls?: boolean;
    /** Fade the overflowing edges, shown only while there is more to scroll to that way. */
    showFades?: boolean;
    className?: string;
}

/** Fractional track widths leave a sub-pixel remainder at either end of the scroll range. */
const SCROLL_END_EPSILON = 1;

/**
 * Horizontal scroll-snap strip with optional prev/next controls and fading edges.
 *
 * Slide sizing, spacing and content belong to the caller: set a width on the children and
 * `--carousel-gap` on the carousel itself. One click of a control scrolls by a full track
 * width, so the strip pages rather than stepping slide by slide.
 */
export function Carousel({
    children,
    label,
    previousLabel = 'Scroll backwards',
    nextLabel = 'Scroll forwards',
    showControls = true,
    showFades = false,
    className,
}: Props) {
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

    // Only the track's own width moves the scroll range once the slides are laid out. The
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

    const scrollByPage = (direction: 1 | -1, enabled: boolean) => {
        const track = trackRef.current;
        // An aria-disabled button still fires its click, so the guard belongs here.
        if (!track || !enabled) {
            return;
        }
        track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
    };

    return (
        <div className={classnames(styles.carousel, className)}>
            {showControls && (
                <button
                    type="button"
                    className={styles.control}
                    onClick={() => scrollByPage(-1, canScrollBack)}
                    // `aria-disabled`, not `disabled`: the element styles drop pointer events from a
                    // disabled button, so a control switching off under the pointer would leave the
                    // cursor stale. Omitted entirely when enabled — the selector matches on presence.
                    aria-disabled={canScrollBack ? undefined : true}
                    aria-label={previousLabel}
                >
                    <Icon name="chevronLeft" />
                </button>
            )}

            <div className={styles.viewport}>
                <div
                    className={styles.track}
                    ref={trackRef}
                    onScroll={syncScrollState}
                    // Keyboard-scrollable, so it has to be reachable and named.
                    tabIndex={0}
                    role="group"
                    aria-label={label}
                >
                    {children}
                </div>

                {showFades && canScrollBack && <div className={styles.fadeStart} aria-hidden="true" />}
                {showFades && canScrollOn && <div className={styles.fadeEnd} aria-hidden="true" />}
            </div>

            {showControls && (
                <button
                    type="button"
                    className={styles.control}
                    onClick={() => scrollByPage(1, canScrollOn)}
                    aria-disabled={canScrollOn ? undefined : true}
                    aria-label={nextLabel}
                >
                    <Icon name="chevronRight" />
                </button>
            )}
        </div>
    );
}
