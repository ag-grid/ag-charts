import { useRef, useState, useEffect, type FunctionComponent } from 'react';
import classnames from 'classnames';
import styles from './ExampleIFrame.module.scss';
import { useIntersectionObserver } from '@utils/hooks/useIntersectionObserver';

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
