import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import styles from './Version.module.scss';

const parseVersion = (version: string) => {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch, isMajor: !minor };
};

type VersionProps = {
    date: string;
    version: string;
    blogUrl?: string;
    highlights?: Array<{ text: string; url: string }>;
    buttonURL?: string;
    majorMinor?: boolean;
};

export const Version = ({ date, version, blogUrl, highlights, buttonURL, majorMinor }: VersionProps) => {
    const { major, minor, isMajor } = parseVersion(version);
    const blogHref =
        blogUrl || `https://blog.ag-grid.com/whats-new-in-ag-charts-${minor ? `${major}-${minor}` : major}/`;

    return (
        <div className={styles.version}>
            <div className={styles.topheader}>
                <header>
                    <div className={styles.flex}>
                        <span className={`${styles['text-secondary']} ${styles['font-size-small']}`}>{date}</span>

                        <div className={styles.flex}>
                            {version === '31.0.0' && <span className={styles['latest-tag']}>Latest</span>}
                            {majorMinor && <span className={styles['major-text']}>Major</span>}
                        </div>
                    </div>
                    <div className={styles.flex}>
                        <b className={styles['font-size-large']}>Version {version}</b>
                        <a className={styles.bloglink} href={blogHref}>
                            Read more →
                        </a>
                    </div>
                    <span className={styles.line}></span>
                </header>

                <p className={styles['font-size-small']}>Feature Highlights</p>

                {highlights && highlights.length > 0 && (
                    <ul className={styles['list-style-none']}>
                        {highlights.map((highlight, i) => (
                            <li key={highlight.text + i}>
                                <a href={highlight.url}>{highlight.text}</a>
                            </li>
                        ))}
                    </ul>
                )}

                {buttonURL && (
                    <a
                        className={`${styles.buttonSecondary} button-secondary`}
                        href={urlWithBaseUrl(buttonURL)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        See migration guide
                    </a>
                )}
            </div>

            <a
                className={`${styles.buttonSecondary} button-secondary`}
                href={urlWithBaseUrl(`/changelog/?fixVersion=${version}`)}
                target="_blank"
                rel="noopener noreferrer"
            >
                See all changes
            </a>
        </div>
    );
};
