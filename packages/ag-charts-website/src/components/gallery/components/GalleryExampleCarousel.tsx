import { Carousel } from '@ag-website-shared/components/carousel/Carousel';
import { type FunctionComponent } from 'react';

import { GalleryExampleLink } from './GalleryExampleLink';

interface Props {
    examples: { label: string; name: string }[];
    enableDprScaling: boolean;
    /** Names the strip for assistive technology, matching the heading above it. */
    label: string;
}

/** A gallery page's related-examples strip: thumbnail cards in the shared carousel. */
export const GalleryExampleCarousel: FunctionComponent<Props> = ({ examples, enableDprScaling, label }) => (
    <Carousel label={label} previousLabel="Scroll to previous examples" nextLabel="Scroll to more examples">
        {examples.map(({ label: exampleLabel, name }) => (
            <GalleryExampleLink
                key={name}
                label={exampleLabel}
                exampleName={name}
                enableDprScaling={enableDprScaling}
                layout="thumbnail"
            />
        ))}
    </Carousel>
);
