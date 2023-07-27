import { OpenInCTA } from '../../../components/open-in-cta/OpenInCTA';
import { useCallback, type FunctionComponent } from 'react';
import { openPlunker } from '../utils/plunkr';
import { fetchTextFile } from '../utils/fetchTextFile';
import type { FileContents } from '../../examples-generator/types';
import { getDocsExampleUrlWithRelativePath } from '../../../utils/pages';
import type { InternalFramework } from 'packages/ag-charts-website/src/types/ag-grid';

interface Props {
    title: string;
    files: FileContents;
    boilerPlateFiles?: FileContents;
    fileToOpen: string;
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}

export const OpenInPlunkr: FunctionComponent<Props> = ({
    title,
    files,
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
        const plunkrHtml = await fetchTextFile(
            getDocsExampleUrlWithRelativePath({
                internalFramework,
                pageName,
                exampleName,
            })
        );

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
