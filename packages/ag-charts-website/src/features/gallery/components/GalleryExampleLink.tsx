import { useTheme } from '@utils/hooks/useTheme';
import classnames from 'classnames';
import { type FunctionComponent, useEffect, useState } from 'react';

import { getPageUrl, getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const { theme } = useTheme();

    const imageUrl = getPlainExampleImageUrl({ exampleName, theme, ext: 'png' });

    return (
        <a
            className={classnames(styles.link, className, 'font-size-responsive', 'font-size-small', 'text-secondary')}
            href={getPageUrl(exampleName)}
        >
            <picture>
                <source srcSet={getPlainExampleImageUrl({ exampleName, theme, ext: 'webp' })} type="image/webp" />
                <img
                    src={getPlainExampleImageUrl({ exampleName, theme, ext: 'png' })}
                    alt={label}
                    // Set explicit width and height so the layout doesn't jump around as the page is loading
                    width={600}
                    height={375}
                />
            </picture>
            <span>{label}</span>
        </a>
    );
};
