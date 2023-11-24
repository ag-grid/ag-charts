import { useTheme } from '@utils/hooks/useTheme';
import classNames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleImage.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
}

export const GalleryExampleImage: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const { theme } = useTheme();

    return (
        <picture>
            <source srcSet={getPlainExampleImageUrl({ exampleName, theme, ext: 'webp' })} type="image/webp" />
            <img
                src={getPlainExampleImageUrl({ exampleName, theme, ext: 'png' })}
                className={classNames(styles.image, className)}
                alt={label}
                // Set explicit width and height so the layout doesn't jump around as the page is loading
                width={600}
                height={375}
            />
        </picture>
    );
};
