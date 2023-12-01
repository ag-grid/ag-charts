import classnames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPageUrl } from '../utils/urlPaths';
import { GalleryExampleImage } from './GalleryExampleImage';
import styles from './GalleryExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
    layout?: '5-col' | '3-col';
    onlyShowOnLargeScreen?: boolean;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({
    label,
    exampleName,
    layout = '5-col',
    onlyShowOnLargeScreen,
}) => {
    return (
        <a
            className={classnames(
                styles.link,
                'galleryExample',
                styles[`layout-${layout}`],
                'font-size-responsive',
                'font-size-small',
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
