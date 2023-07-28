import { getEntry } from 'astro:content';
import { getGeneratedDemoContents } from '../../../../features/demo/utils/examplesGenerator';
import { getDemoExamplePages } from '../../../../features/demo/utils/pageData';
import { transformPlainEntryFile } from '../../../../features/demo/utils/transformPlainEntryFile';

interface Params {
    exampleName: string;
}

export async function getStaticPaths() {
    const demosEntry = await getEntry('demo', 'demos');
    const pages = getDemoExamplePages({ demos: demosEntry.data });
    return pages;
}

export async function get({ params }: { params: Params }) {
    const { exampleName } = params;

    const { entryFileName, files = {} } =
        (await getGeneratedDemoContents({
            exampleName,
        })) || {};
    const entryFile = files[entryFileName!];
    const body = transformPlainEntryFile(entryFile);

    return {
        body,
    };
}
