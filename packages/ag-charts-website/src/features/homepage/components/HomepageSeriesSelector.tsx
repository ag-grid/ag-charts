import type { GalleryData, GalleryHomepageExample } from '@ag-grid-types';
import { Icon, type IconName } from '@components/icon/Icon';
import { ExampleIFrame } from '@features/example-runner/components/ExampleIFrame';
import { getExampleUrl } from '@features/gallery/utils/urlPaths';
import { getSeriesExampleGroup } from '@utils/getSeriesExampleGroup';
import classNames from 'classnames';
import { useState } from 'react';

import styles from './HomepageSeriesSelector.module.scss';

interface Props {
    galleryData: GalleryData;
    defaultExampleName: string;
}

export function HomepageSeriesSelector({ galleryData, defaultExampleName }: Props) {
    const [exampleName, setExampleName] = useState<string>(defaultExampleName);
    const { homepage } = galleryData;
    const exampleUrl = exampleName
        ? getExampleUrl({
              exampleName,
          })
        : undefined;

    return (
        <>
            <div className={styles.seriesChart}>
                <div className={styles.chartContainer}>{exampleUrl && <ExampleIFrame url={exampleUrl} />}</div>
            </div>

            <div className={styles.seriesList}>
                <ul className="list-style-none">
                    {homepage.map(({ seriesExampleName }: GalleryHomepageExample) => {
                        const seriesExample = getSeriesExampleGroup({
                            seriesExampleName,
                            galleryData,
                        });

                        if (!seriesExample) {
                            throw new Error(`No series example found for: ${seriesExampleName}`);
                        }

                        const { icon, title } = seriesExample;

                        return (
                            <li>
                                <button
                                    className={classNames('button-secondary', {
                                        [styles.buttonActive]: seriesExampleName === exampleName,
                                    })}
                                    onClick={() => {
                                        setExampleName(seriesExampleName);
                                    }}
                                >
                                    <Icon name={icon as IconName} />
                                    <span>{title}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </>
    );
}
