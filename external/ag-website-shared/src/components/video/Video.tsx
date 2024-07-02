import styles from './Video.module.scss';

interface Props {
    videoSrc?: string;
    darkModeVideoSrc?: string;
    autoplay?: boolean;
    showPlayPauseButtons?: boolean;
}

export const Video = ({ videoSrc, darkModeVideoSrc, autoplay, showPlayPauseButtons }: Props) => {
    return <video className={styles.dummyVideoStyle} src={videoSrc} autoPlay muted></video>;
};
