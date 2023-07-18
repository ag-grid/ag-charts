import { OpenInCTA } from '../../../components/open-in-cta/OpenInCTA';
import { useCallback, type FunctionComponent } from 'react';
import { openPlunker } from '../utils/plunkr';
import type { FileContents } from '../../examples-generator/types';
import { getExampleUrlWithRelativePath } from '../../../utils/pages';
import type { InternalFramework } from 'packages/ag-charts-website/src/types/ag-grid';

interface Props {
    title: string;
    files: FileContents;
    fileToOpen: string;
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}

export const OpenInPlunkr: FunctionComponent<Props> = ({
    title,
    files,
    fileToOpen,
    internalFramework,
    pageName,
    exampleName,
}) => {
    /**
     * Get Plunkr HTML files, which requires relative paths
     */
    const getPlunkrHtml = useCallback(async () => {
        const plunkrHtml = await fetch(
            getExampleUrlWithRelativePath({
                internalFramework,
                pageName,
                exampleName,
            })
        ).then((res) => res.text());

        return plunkrHtml;
    }, [internalFramework, pageName, exampleName]);

    return (
        <OpenInCTA
            type="plunker"
            onClick={async () => {
                const plunkrHtml = await getPlunkrHtml();
                const plunkrExampleFiles = {
                    ...files,
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
