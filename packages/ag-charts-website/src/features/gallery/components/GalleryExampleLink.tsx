import { useTheme } from '@utils/hooks/useTheme';
import classnames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPageUrl, getPlainExampleImageUrl } from '../utils/urlPaths';
import { GalleryExampleImage } from './GalleryExampleImage';
import styles from './GalleryExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    return (
        <a
            className={classnames(styles.link, className, 'font-size-responsive', 'font-size-small', 'text-secondary')}
            href={getPageUrl(exampleName)}
        >
            <GalleryExampleImage label={label} exampleName={exampleName} />
            <span>{label}</span>
        </a>
    );
};
