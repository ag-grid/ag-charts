import styles from '@design-system/modules/VideoSection.module.scss';
import classnames from 'classnames';
import React, { FunctionComponent, useEffect, useState } from 'react';

type VideoProps = {
    id: string;
    title: string;
    header: boolean;
    children: any;
};

/**
 * This embeds a YouTube video into the page.
 */
const VideoSection = ({ id, title, header, children }: VideoProps) => {
    return (
        <>
            <div className={styles.videoSection}>
                <div className={classnames({ [styles.header]: header })}>{children}</div>
                <iframe
                    className={styles.ytIframe}
                    title={title}
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    frameBorder="0"
                    modestbranding="1"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </>
    );
};

export default VideoSection;
