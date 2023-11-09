import * as prettier from 'prettier';

/**
 * Format a block of text by the inferred file type.
 * @param fileName Name of the file, including the extension.
 * @param text Text to format.
 * @param extensionsToFormat optional Only format the text if its extension is in this array.
 * @returns Promise<string>
 */
export function format(fileName: string, text: string, extensionsToFormat?: Array<string>) {
    const parts = fileName.split('.');
    const maybeExtension = parts[parts.length - 1];

    let extension: PrettierExtension = 'html';
    if (Object.keys(prettierParsers).includes(maybeExtension)) {
        extension = maybeExtension as PrettierExtension;
    }

    if (extensionsToFormat && !extensionsToFormat.includes(extension)) {
        return text;
    }

    return prettier.format(text, {
        parser: prettierParsers[extension],
        ...prettierConfig,
        ...(extension === 'jsx' || extension === 'tsx' ? prettierConfigJsx : {}),
    });
}

type PrettierExtension = 'html' | 'json' | 'js' | 'jsx' | 'ts' | 'tsx';

const prettierParsers: { [T in PrettierExtension]: string } = {
    html: 'html',
    js: 'babel',
    ts: 'typescript',
    jsx: 'babel',
    tsx: 'babel-ts',
    json: 'json',
};

// A trimmed copy of `.prettierrc`
const prettierConfig = {
    tabWidth: 4,
    printWidth: 120,
    singleQuote: true,
    importOrder: ['^ag-charts-(.*)$', '^[./]'],
    importOrderParserPlugins: ['typescript', 'decorators-legacy'],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    plugins: ['@trivago/prettier-plugin-sort-imports'],
};

const prettierConfigJsx = {
    importOrderParserPlugins: ['typescript', 'decorators-legacy', 'jsx'],
};
