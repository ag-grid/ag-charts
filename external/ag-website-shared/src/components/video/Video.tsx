import { useDarkmode } from '@utils/hooks/useDarkmode';
import { useEffect, useState } from 'react';

import styles from './Video.module.scss';

interface Props {
    videoSrc?: string;
    darkModeVideoSrc?: string;
    autoplay?: boolean;
    showPlayPauseButtons?: boolean;
}

export const Video = ({ videoSrc, darkModeVideoSrc, autoplay, showPlayPauseButtons }: Props) => {
    const [darkMode] = useDarkmode();
    const [src, setSrc] = useState<string>(videoSrc);

    useEffect(() => {
        if (darkModeVideoSrc && darkMode) {
            setSrc(darkModeVideoSrc);
        } else {
            setSrc(videoSrc);
        }
    }, [darkMode]);

    return <video className={styles.dummyVideoStyle} src={src} autoPlay muted loop></video>;
};
