import type { InternalFramework } from '@ag-grid-types';
import { excludeHiddenFiles } from '@components/docs/utils/excludeHiddenFiles';
import type { FileContents, GeneratedContents } from '@components/example-generator/types';
import { stripOutExampleGeneratorCode } from '@components/example-runner/components/stripOutExampleGeneratorCode';

export interface ExampleViewerFiles {
    /** Files the code viewer shows, cleaned of the example generator harness */
    files: FileContents;
    /** File selected when the code viewer opens */
    mainFileName: string;
}

/**
 * The files as the example runner code viewer presents them: the hidden files excluded for the
 * internal framework and the harness the example generator injects stripped out.
 *
 * The viewer swaps `index.html` for the rendered example page, which only the example's Astro route
 * can produce, so that file is left out rather than embedded in a form the Code button never shows.
 *
 * Shared by the build-time renders (the crawlable source panel and the markdown twin pages) so
 * they cannot drift from what the Code button reveals.
 */
export function getExampleViewerFiles(
    contents: GeneratedContents,
    internalFramework: InternalFramework
): ExampleViewerFiles {
    const files = excludeHiddenFiles({ internalFramework, files: contents.files });
    delete files['index.html'];
    stripOutExampleGeneratorCode(files);

    return {
        files,
        mainFileName: contents.mainFileName ?? contents.entryFileName,
    };
}
