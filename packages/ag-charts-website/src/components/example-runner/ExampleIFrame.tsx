import { useRef, type FunctionComponent } from 'react';
import styles from './ExampleIFrame.module.scss';
import { useIntersectionObserver } from '../../utils/hooks/useIntersectionObserver';

interface Props {
    url: string;
}

export const ExampleIFrame: FunctionComponent<Props> = ({ url }) => {
    const iFrameRef = useRef<HTMLIFrameElement>(null);

    // Only show example iFrame if it is visible on the screen
    useIntersectionObserver({
        elementRef: iFrameRef,
        onChange: ({ isIntersecting }) => {
            if (isIntersecting && iFrameRef.current && !iFrameRef.current.src) {
                iFrameRef.current.src = url;
            }
        },
    });

    return (
        <div className={styles.container}>
            <iframe ref={iFrameRef} className={styles.iframe} />;
        </div>
    );
};
