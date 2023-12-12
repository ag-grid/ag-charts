import classnames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPageUrl } from '../utils/urlPaths';
import { GalleryExampleImage } from './GalleryExampleImage';
import styles from './GalleryExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
    layout?: '5-col' | '3-col';
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, layout = '5-col' }) => {
    return (
        <a
            className={classnames(
                styles.link,
                'galleryExample',
                styles[`layout-${layout}`],
                'text-sm',
                'text-secondary',
                {
                    [styles.onlyShowOnLargeScreen]: onlyShowOnLargeScreen,
                }
            )}
            href={getPageUrl(exampleName)}
        >
            <GalleryExampleImage label={label} exampleName={exampleName} />
            <span>{label}</span>
        </a>
    );
};
