import styles from '@design-system/modules/GalleryExampleLink.module.scss';
import classnames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPageUrl } from '../utils/urlPaths';
import { GalleryExampleImage } from './GalleryExampleImage';

interface Props {
    label: string;
    exampleName: string;
    id?: string;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, id }) => {
    return (
        <a
            className={classnames(styles.link, 'galleryExample', styles[`layout-3-col`], 'text-sm', 'text-secondary')}
            href={getPageUrl(exampleName)}
            id={id}
        >
            <div className={styles.image}>
                <GalleryExampleImage label={label} exampleName={exampleName} />
            </div>
            <span className={styles.label}>{label}</span>
        </a>
    );
};
