import styles from '@legacy-design-system/modules/GalleryExampleLink.module.scss';
import classnames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPageUrl } from '../utils/urlPaths';
import { GalleryExampleImage } from './GalleryExampleImage';

interface Props {
    label: string;
    exampleName: string;
    id?: string;
    enableDprScaling: boolean;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, id, enableDprScaling }) => {
    return (
        <a
            className={classnames(styles.link, 'galleryExample', styles[`layout-3-col`], 'text-sm', 'text-secondary')}
            href={getPageUrl(exampleName)}
            id={id}
        >
            <div className={styles.image}>
                <GalleryExampleImage label={label} exampleName={exampleName} enableDprScaling={enableDprScaling} />
            </div>
            <span className={styles.label}>{label}</span>
        </a>
    );
};
