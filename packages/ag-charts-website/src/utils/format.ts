import { readFile } from 'fs/promises';
import * as prettier from 'prettier';

/**
 * Format a block of text by the inferred file type.
 * @param fileName Name of the file, including the extension.
 * @param text Text to format.
 * @param extensionsToFormat optional Only format the text if its extension is in this array.
 * @returns Promise<string>
 */
export async function format(fileName: string, text: string, extensionsToFormat?: Array<string>) {
    const parts = fileName.split('.');
    const maybeExtension = parts[parts.length - 1];

    let extension: PrettierExtension = 'html';
    if (Object.keys(prettierParsers).includes(maybeExtension)) {
        extension = maybeExtension as PrettierExtension;
    }

    if (extensionsToFormat && !extensionsToFormat.includes(extension)) {
        return text;
    }

    const config = await getPrettierConfig(extension);

    return prettier.format(text, {
        parser: prettierParsers[extension],
        ...config,
    });
}

type PrettierExtension = 'html' | 'json' | 'css' | 'js' | 'jsx' | 'ts' | 'tsx';

const prettierParsers: { [T in PrettierExtension]: string } = {
    html: 'html',
    json: 'json',
    css: 'css',
    js: 'babel',
    ts: 'typescript',
    jsx: 'babel',
    tsx: 'babel-ts',
};

async function getPrettierConfig(extension: PrettierExtension) {
    const prettierRC = await readFile('.prettierrc', 'utf8');
    const json = JSON.parse(prettierRC);

    const prettierConfig: any = {};
    const rejects = ['overrides'];
    for (const [key, value] of Object.entries(json)) {
        if (rejects.includes(key)) continue;
        prettierConfig[key] = value;
    }

    if (extension === 'jsx' || extension === 'tsx') {
        prettierConfig['importOrderParserPlugins'].push('jsx');
    }

    return prettierConfig;
}
