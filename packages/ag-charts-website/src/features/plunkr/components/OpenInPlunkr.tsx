import type { InternalFramework } from '@ag-grid-types';
import { OpenInCTA } from '@components/open-in-cta/OpenInCTA';
import type { FileContents } from '@features/examples-generator/types';
import { type FunctionComponent, useCallback } from 'react';

import { fetchTextFile } from '../utils/fetchTextFile';
import { openPlunker } from '../utils/plunkr';

interface Props {
    title: string;
    files: FileContents;
    plunkrHtmlUrl: string;
    boilerPlateFiles?: FileContents;
    fileToOpen: string;
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}

export const OpenInPlunkr: FunctionComponent<Props> = ({
    title,
    files,
    plunkrHtmlUrl,
    boilerPlateFiles,
    fileToOpen,
    internalFramework,
    pageName,
    exampleName,
}) => {
    /**
     * Get Plunkr HTML files, which requires relative paths
     */
    const getPlunkrHtml = useCallback(async () => {
        const plunkrHtml = await fetchTextFile(plunkrHtmlUrl);

        return plunkrHtml;
    }, [internalFramework, pageName, exampleName]);

    return (
        <OpenInCTA
            type="plunker"
            onClick={async () => {
                const plunkrHtml = await getPlunkrHtml();
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
