import classnames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPageUrl } from '../utils/urlPaths';
import { GalleryExampleImage } from './GalleryExampleImage';
import styles from './GalleryExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
    enableDprScaling: boolean;
    isModified?: boolean;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, enableDprScaling, isModified }) => {
    return (
        <a
            className={classnames(styles.link, 'galleryExample', styles[`layout-3-col`], 'text-sm', 'text-secondary', {
                [styles.modified]: isModified,
            })}
            href={getPageUrl(exampleName)}
        >
            <div className={styles.image}>
                <GalleryExampleImage label={label} exampleName={exampleName} enableDprScaling={enableDprScaling} />
            </div>
            <span className={styles.label}>
                {label}
                {isModified && (
                    <span className={styles.modifiedIndicator} title="Modified on this branch">
                        ●
                    </span>
                )}
            </span>
        </a>
    );
};
