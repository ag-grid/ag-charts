import { EXAMPLE_RELOADING_MESSAGE_TYPE } from '@ag-website-shared/components/loading-logo/messages';
import { useIntersectionObserver } from '@ag-website-shared/utils/hooks/useIntersectionObserver';
import classnames from 'classnames';
import { type FunctionComponent, useEffect, useRef, useState } from 'react';

import styles from './ExampleIFrame.module.scss';

interface Props {
    title: string;
    isHidden?: boolean;
    url?: string;
    loadingIFrameId: string;
}

export const ExampleIFrame: FunctionComponent<Props> = ({ title, isHidden, url, loadingIFrameId }) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const iFrameRef = useRef<HTMLIFrameElement>(null);

    // Only show example iFrame if it is visible on the screen
    useIntersectionObserver({
        elementRef: iFrameRef,
        onChange: ({ isIntersecting: newIsIntersecting }) => {
            if (url != null && newIsIntersecting && iFrameRef.current && !iFrameRef.current.src) {
                iFrameRef.current.src = url;
            }
            setIsIntersecting(newIsIntersecting);
        },
    });

    useEffect(() => {
        const currentSrc = iFrameRef.current?.src && new URL(iFrameRef.current.src);
        if (!isIntersecting || !url || !iFrameRef.current || (currentSrc as URL)?.pathname === url) {
            return;
        }

        if (currentSrc) {
            // Post before navigating, otherwise the stale example stays visible until the loading
            // logo island handles the message
            window.postMessage({ type: EXAMPLE_RELOADING_MESSAGE_TYPE, loadingIFrameId });
        }

        iFrameRef.current.src = url;
    }, [isIntersecting, url, loadingIFrameId]);

    return (
        <div
            className={classnames(styles.container, {
                [styles.hidden]: isHidden,
            })}
        >
            {/*`exampleRunner` class is used by the dark mode toggle to post a message to this iFrame*/}
            <iframe
                id={loadingIFrameId}
                title={title}
                ref={iFrameRef}
                className={classnames('exampleRunner', styles.iframe)}
                style={{ visibility: 'hidden' }}
            />
        </div>
    );
};
