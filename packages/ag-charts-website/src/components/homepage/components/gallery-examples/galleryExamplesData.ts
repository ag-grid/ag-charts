import { DARK_MODE_REGEX } from '@ag-website-shared/utils/extraCodeSnippets';
import { getGeneratedContents } from '@components/example-generator';
import {
    EXAMPLE_CODE_END,
    EXAMPLE_CODE_START,
    GLOBAL_UPDATE_EXAMPLES_VARIABLE,
    GLOBAL_UPDATE_FUNCTION,
} from '@components/homepage/constants';
import { getDarkModeSnippet } from '@utils/getDarkModeSnippet';
import type { CollectionEntry } from 'astro:content';

type GalleryData = {
    galleryData: CollectionEntry<'homepageGallery'>['data'];
    allGalleryData: CollectionEntry<'gallery'>['data'];
};

/**
 * Replace newline with token to avoid escaping issues in JSON.stringify
 */
export const NEWLINE_TOKEN = '__NEWLINE__';

const escape = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

async function getUpdateExampleFunction({
    exampleName,
    startToken = '',
    endToken = '',
    replaceNewlineToken,
}: {
    exampleName: string;
    startToken?: string;
    endToken?: string;
    replaceNewlineToken?: string;
}) {
    const { generatedFiles } = (await getGeneratedContents({
        type: 'gallery',
        exampleName,
    }))!;

    let mainJs = generatedFiles['main.js']
        // Remove dark mode snippets, so it can be added once later
        ?.replace(DARK_MODE_REGEX, '')
        // Update create methods with global update function
        .replace('AgCharts.create(options);', GLOBAL_UPDATE_FUNCTION)
        .replace('AgCharts.createGauge(options);', GLOBAL_UPDATE_FUNCTION)
        // Clean up
        .trim();

    let dataJs = generatedFiles['data.js']?.trim();

    if (replaceNewlineToken) {
        mainJs = mainJs.replaceAll('\n', replaceNewlineToken);
        dataJs = dataJs?.replaceAll('\n', replaceNewlineToken);
    }

    const exampleFunction = `() => {${dataJs ? dataJs : ''}${mainJs}}`;

    return startToken + exampleFunction + endToken;
}

export async function getGalleryExamplesData({
    galleryData,
    allGalleryData,
    startToken = '',
    endToken = '',
    replaceNewlineToken,
}: GalleryData & {
    startToken?: string;
    endToken?: string;
    replaceNewlineToken?: string;
}) {
    const exampleData = allGalleryData.series
        .flatMap((seriesGroup) => seriesGroup)
        .filter((series) => series.seriesName in galleryData)
        .map(async (series) => {
            const exampleName = galleryData[series.seriesName];
            const example = series.examples.find((ex) => ex.name === exampleName);
            return [
                series.seriesName,
                {
                    title: example!.title,
                    exampleName: example!.name,
                    buttonText: series.title,
                    icon: series.icon,
                    updateExample: await getUpdateExampleFunction({
                        exampleName,
                        startToken,
                        endToken,
                        replaceNewlineToken,
                    }),
                },
            ];
        });

    return Object.fromEntries(await Promise.all(exampleData));
}

export async function getGalleryExamplesJs({ galleryData, allGalleryData }: GalleryData) {
    const replaceNewlineToken = NEWLINE_TOKEN;
    const examplesData = await getGalleryExamplesData({
        galleryData,
        allGalleryData,
        startToken: EXAMPLE_CODE_START,
        endToken: EXAMPLE_CODE_END,
        replaceNewlineToken,
    });

    // Extract `updateExample` and assign to key
    const exampleKeys = Object.keys(examplesData);
    const updateExamples: Record<string, string> = {};
    for (const key of exampleKeys) {
        const example = examplesData[key];
        updateExamples[key] = example.updateExample;
    }

    // Remove start and end quotation marks, so that the code is runnable and not a string
    const startRegex = new RegExp(`"${escape(EXAMPLE_CODE_START)}`, 'g');
    const endRegex = new RegExp(`${escape(EXAMPLE_CODE_END)}"`, 'g');
    const darkModeSnippet = getDarkModeSnippet({ chartAPI: 'agCharts.AgCharts' });
    const examplesString =
        JSON.stringify(updateExamples, null, 2)
            .replaceAll(startRegex, '')
            .replaceAll(endRegex, '')
            .replaceAll(replaceNewlineToken, '\n')
            .replaceAll('\\\\n', '\\n')
            // Remove escaped quotes
            .replaceAll('\\"', '"')
            .replaceAll("\\'", "'") +
        '\n' +
        darkModeSnippet;

    return `window.${GLOBAL_UPDATE_EXAMPLES_VARIABLE} = ${examplesString};`;
}
