import classnames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPageUrl } from '../utils/urlPaths';
import { GalleryExampleImage } from './GalleryExampleImage';
import styles from './GalleryExampleLink.module.scss';

/**
 * How the card sizes itself: `grid` is the gallery hub's three-column measure, `thumbnail` a
 * fixed-width carousel slide, and `fill` takes whatever cell its container gives it.
 */
export type GalleryExampleLinkLayout = 'grid' | 'thumbnail' | 'fill';

interface Props {
    label: string;
    exampleName: string;
    enableDprScaling: boolean;
    isModified?: boolean;
    layout?: GalleryExampleLinkLayout;
}

const LAYOUT_CLASS: Record<GalleryExampleLinkLayout, string> = {
    grid: 'layout-3-col',
    thumbnail: 'layout-thumbnail',
    fill: 'layout-fill',
};

export const GalleryExampleLink: FunctionComponent<Props> = ({
    label,
    exampleName,
    enableDprScaling,
    isModified,
    layout = 'grid',
}) => {
    return (
        <a
            className={classnames(
                styles.link,
                'galleryExample',
                styles[LAYOUT_CLASS[layout]],
                'text-sm',
                'text-secondary',
                { [styles.modified]: isModified }
            )}
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
