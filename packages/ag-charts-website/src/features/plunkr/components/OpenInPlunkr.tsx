import { OpenInCTA } from '@components/open-in-cta/OpenInCTA';
import type { FileContents } from '@features/examples-generator/types';
import type { FunctionComponent } from 'react';

import { fetchTextFile } from '../utils/fetchTextFile';
import { openPlunker } from '../utils/plunkr';

interface Props {
    title: string;
    files: FileContents;
    plunkrHtmlUrl: string;
    boilerPlateFiles?: FileContents;
    fileToOpen: string;
}

export const OpenInPlunkr: FunctionComponent<Props> = ({
    title,
    files,
    plunkrHtmlUrl,
    boilerPlateFiles,
    fileToOpen,
}) => {
    return (
        <OpenInCTA
            type="plunker"
            onClick={async () => {
                const html = await fetchTextFile(plunkrHtmlUrl);
                const plunkrExampleFiles = {
                    ...files,
                    ...boilerPlateFiles,
                    'index.html': html,
                };
                openPlunker({
                    title,
                    files: plunkrExampleFiles,
                    fileToOpen,
                });
            }}
        />
    );
};
