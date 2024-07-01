import { getImageUrl } from '@features/docs/utils/urlPaths';
import classnames from 'classnames';
import type { ReactNode } from 'react';

import styles from './ImageCaption.module.scss';

interface Props {
    pageName: string;
    imageName: string;
    alt: string;
    centered: boolean;
    children: ReactNode;
    constrained: boolean;
    descriptionTop: boolean;
    width: string;
    height: string;
    minWidth: string;
    maxWidth: string;
    filterDarkmode: boolean;
}

/**
 * This can be used to show an image in a box, along with text if provided,
 * and provides various options for configuring the appearance.
 */
const ImageCaption = ({
    pageName,
    imageName,
    alt,
    centered,
    children,
    constrained,
    descriptionTop,
    width,
    height,
    maxWidth,
    minWidth,
    filterDarkmode = false,
}: Props) => {
    const imgSrc = getImageUrl({
        pageName,
        imageName,
    });

    const style: any = {};
    if (width != null) {
        style.width = width;
    }
    if (minWidth != null) {
        style.minWidth = minWidth;
    }
    if (maxWidth != null) {
        style.maxWidth = maxWidth;
    }
    if (height != null) {
        style.height = height;
    }

    const description = children && (
        <div
            className={classnames(styles.body, {
                [styles.top]: descriptionTop,
            })}
        >
            <div className={styles.bodyText}>{children}</div>
        </div>
    );

    return (
        <div
            className={classnames(styles.imageCaption, {
                [styles.centered]: centered,
                [styles.constrained]: constrained,
                [styles.darkmodeFilter]: filterDarkmode,
            })}
            style={style}
        >
            {descriptionTop && description}
            <img src={imgSrc} className={styles.image} alt={alt} />
            {!descriptionTop && description}
        </div>
    );
};

export default ImageCaption;
