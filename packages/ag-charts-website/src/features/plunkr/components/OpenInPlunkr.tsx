import { OpenInCTA } from '@components/open-in-cta/OpenInCTA';
import { removeGeneratedAstroTags } from '@features/example-runner/utils/removeGeneratedAstroTags';
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
                console.log(plunkrHtmlUrl);
                const html = await fetchTextFile(plunkrHtmlUrl);
                const plunkrHtml = removeGeneratedAstroTags(html);
                const plunkrExampleFiles = {
                    ...files,
                    ...boilerPlateFiles,
                    'index.html': plunkrHtml,
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
