import { getEntry } from 'astro:content';
import { getGeneratedPlainDemoContents } from '../../../../features/demo/utils/examplesGenerator';
import { getDemoExamplePages } from '../../../../features/demo/utils/pageData';

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

    const generatedContents =
        (await getGeneratedPlainDemoContents({
            exampleName,
        })) || {};
    const response = generatedContents;
    const body = JSON.stringify(response);

    return {
        body,
    };
}
