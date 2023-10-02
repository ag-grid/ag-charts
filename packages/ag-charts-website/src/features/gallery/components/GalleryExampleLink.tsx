import classnames from 'classnames';
import type { FunctionComponent } from 'react';

import { getPageUrl, getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleLink.module.scss';
import { useStore } from '@nanostores/react';
import { $theme } from '@stores/themeStore';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const theme = useStore($theme);
    const imageUrl = getPlainExampleImageUrl({
        exampleName,
        theme
    });

    return (
        <a
            className={classnames(styles.link, className, 'font-size-responsive', 'font-size-small', 'text-secondary')}
            href={getPageUrl(exampleName)}
        >
            <img src={imageUrl} alt={label} />
            <span>{label + " " + theme}</span>
        </a>
    );
};
