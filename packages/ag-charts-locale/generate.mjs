import fs from 'fs/promises';
import glob from 'glob';
import prettier from 'prettier';

const tsv = await fs.readFile(new URL('en-US.tsv', import.meta.url), 'utf-8');
const entries = tsv
    .trim()
    .split('\n')
    .slice(1)
    .map((row) => {
        const [key, translation] = row.split('\t');
        return [key, translation];
    });
const enJson = Object.fromEntries(entries);

for (const file of glob.sync('src/??-??.ts')) {
    const contents = await fs.readFile(new URL(file, import.meta.url), 'utf8');
    const firstBrace = contents.indexOf('{');
    const lastBrace = contents.lastIndexOf('}') + 1;
    const jsonContents = contents.slice(firstBrace, lastBrace);
    const json = eval(`(${jsonContents})`);

    const outputKeys = {};
    for (const [key, enTranslation] of Object.entries(enJson)) {
        let translation = json[key];
        if (translation == null) {
            console.warn('Missing translation');
            translation = enTranslation;
        }
        outputKeys[key] = translation;
    }

    const outputContents = Object.entries(outputKeys)
        .map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`)
        .join(',');
    const output = contents.slice(0, firstBrace) + '{' + outputContents + '}' + contents.slice(lastBrace);
    const formattedOutput = await prettier.format(output, {
        parser: 'typescript',
        trailingComma: 'es5',
        tabWidth: 4,
        printWidth: 120,
        singleQuote: true,
    });
    await fs.writeFile(new URL(file, import.meta.url), formattedOutput);
}
