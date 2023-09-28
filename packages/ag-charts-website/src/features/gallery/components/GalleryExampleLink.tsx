import classnames from 'classnames';
import type { FunctionComponent } from 'react';

import { getPageUrl, getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const imageUrl = getPlainExampleImageUrl({
        exampleName,
    });

    return (
        <a
            className={classnames(styles.link, className, 'font-size-responsive', 'font-size-small', 'text-secondary')}
            href={getPageUrl(exampleName)}
        >
            <img src={imageUrl} alt={label} />
            <span>{label}</span>
        </a>
    );
};
