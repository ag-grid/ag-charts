import classnames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPageUrl } from '../utils/urlPaths';
import { GalleryExampleImage } from './GalleryExampleImage';
import styles from './GalleryExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName }) => {
    return (
        <a
            className={classnames(styles.link, 'galleryExample', styles[`layout-3-col`], 'text-sm', 'text-secondary')}
            href={getPageUrl(exampleName)}
        >
            <GalleryExampleImage label={label} exampleName={exampleName} />
            <span>{label}</span>
        </a>
    );
};
