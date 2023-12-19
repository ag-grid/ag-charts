import { OpenInCTA } from '@components/open-in-cta/OpenInCTA';
import type { FileContents } from '@features/examples-generator/types';
import { fetchTextFile } from '@utils/fetchTextFile';
import type { FunctionComponent } from 'react';

import { openPlunker } from '../utils/plunkr';

interface Props {
    title: string;
    files: FileContents;
    htmlUrl: string;
    boilerPlateFiles?: FileContents;
    fileToOpen: string;
}

export const OpenInPlunkr: FunctionComponent<Props> = ({ title, files, htmlUrl, boilerPlateFiles, fileToOpen }) => {
    return (
        <OpenInCTA
            type="plunker"
            onClick={async () => {
                const html = await fetchTextFile(htmlUrl);
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
