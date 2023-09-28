import { useIntersectionObserver } from '@utils/hooks/useIntersectionObserver';
import classnames from 'classnames';
import { type FunctionComponent, useEffect, useRef, useState } from 'react';
import styles from './ExampleIFrame.module.scss';

interface Props {
    isHidden?: boolean;
    url: string;
}

export const ExampleIFrame: FunctionComponent<Props> = ({ isHidden, url }) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const iFrameRef = useRef<HTMLIFrameElement>(null);

    // Only show example iFrame if it is visible on the screen
    useIntersectionObserver({
        elementRef: iFrameRef,
        onChange: ({ isIntersecting: newIsIntersecting }) => {
            if (newIsIntersecting && iFrameRef.current && !iFrameRef.current.src) {
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

        iFrameRef.current.src = url;
    }, [isIntersecting, url]);

    return (
        <div
            className={classnames(styles.container, {
                [styles.hidden]: isHidden,
            })}
        >
            <iframe ref={iFrameRef} className={styles.iframe} />
        </div>
    );
};
