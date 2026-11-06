import type { ThemeName } from '@stores/themeStore';

const CREATE_CALL_REGEX = /\bAgCharts\.create\w*\(\s*(\w+)\s*\)/g;
const OPTIONS_END_REGEX = /^\};?$/;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface OptionsBlock {
    start: number;
    end: number;
    indent: string;
    quote: string;
}

const findOptionsBlock = (lines: string[], optionsName: string): OptionsBlock | undefined => {
    const declaration = new RegExp(`^(?:const|let|var) ${escapeRegex(optionsName)}\\b[^=]*= \\{$`);
    const start = lines.findIndex((line) => declaration.test(line));
    if (start === -1) return;

    const end = lines.findIndex((line, index) => index > start && OPTIONS_END_REGEX.test(line));
    if (end === -1 || end === start + 1) return;

    const body = lines.slice(start + 1, end);
    const indent = body[0].slice(0, body[0].length - body[0].trimStart().length);
    const quote = /['"]/.exec(body.join('\n'))?.[0] ?? "'";
    return { start, end, indent, quote };
};

const setOptionsTheme = (lines: string[], { start, end, indent, quote }: OptionsBlock, theme: ThemeName) => {
    const nestedIndent = indent + indent;
    const themeValue = `${quote}${theme}${quote}`;
    const findLine = (regex: RegExp, from: number, to: number) =>
        lines.findIndex((line, index) => index > from && index < to && regex.test(line));

    const themeIndex = findLine(new RegExp(`^${indent}theme: `), start, end);

    if (themeIndex === -1) {
        const containerIndex = findLine(new RegExp(`^${indent}container: .*,$`), start, end);
        lines.splice((containerIndex === -1 ? start : containerIndex) + 1, 0, `${indent}theme: ${themeValue},`);
        return;
    }

    if (new RegExp(`^${indent}theme: (['"])[^'"]*\\1,$`).test(lines[themeIndex])) {
        lines[themeIndex] = `${indent}theme: ${themeValue},`;
        return;
    }

    if (lines[themeIndex] !== `${indent}theme: {`) return;

    const themeEnd = findLine(new RegExp(`^${indent}\\},?$`), themeIndex, end);
    const baseThemeIndex = findLine(new RegExp(`^${nestedIndent}baseTheme: `), themeIndex, themeEnd);
    if (baseThemeIndex === -1) {
        lines.splice(themeIndex + 1, 0, `${nestedIndent}baseTheme: ${themeValue},`);
    } else {
        lines[baseThemeIndex] = `${nestedIndent}baseTheme: ${themeValue},`;
    }
};

/**
 * Sets `theme` on every top-level options object an example passes to `AgCharts.create*()`, matching
 * the indentation and quotes the options are formatted with. Leaves any options it cannot find, or
 * whose `theme` is not a literal, untouched.
 */
export const setExampleTheme = (source: string, theme: ThemeName) => {
    const lines = source.split('\n');
    const optionsNames = new Set(Array.from(source.matchAll(CREATE_CALL_REGEX), ([, optionsName]) => optionsName));

    for (const optionsName of optionsNames) {
        const block = findOptionsBlock(lines, optionsName);
        if (block != null) {
            setOptionsTheme(lines, block, theme);
        }
    }

    return lines.join('\n');
};
