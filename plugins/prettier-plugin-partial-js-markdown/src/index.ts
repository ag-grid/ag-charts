import type { Parser, Plugin, Printer, SupportLanguage } from 'prettier';

import { tryWrapCode } from './wrapper';

// We extend the markdown parser instead of replacing it
export const languages: SupportLanguage[] = [];

export const parsers: Record<string, Parser> = {
    'partial-js-markdown': {
        ...require('prettier/plugins/markdown').parsers.markdown,
        preprocess: (text: string, options: any) => {
            // Process markdown text to format partial JavaScript blocks
            return processMarkdownWithPartialJS(text);
        },
    },
};

function processMarkdownWithPartialJS(text: string): string {
    // Regular expression to match code blocks
    const codeBlockRegex = /```(js|javascript|jsx|ts|typescript|tsx)\n([\s\S]*?)```/g;

    return text.replace(codeBlockRegex, (match, lang, code) => {
        try {
            const formatted = formatPartialCodeSync(code, lang);
            return '```' + lang + '\n' + formatted + '```';
        } catch (error) {
            // If formatting fails, return original
            return match;
        }
    });
}

function isJavaScriptLang(lang: string | null | undefined): boolean {
    if (!lang) return false;
    const normalized = lang.toLowerCase();
    return ['js', 'javascript', 'jsx', 'ts', 'typescript', 'tsx'].includes(normalized);
}

function formatPartialCodeSync(code: string, lang: string): string {
    const prettier = require('prettier');
    const parser = getParserForLang(lang);

    // First try to format as-is
    try {
        return prettier.format(code, {
            parser,
            printWidth: 120,
            tabWidth: 4,
            singleQuote: true,
            semi: true,
            trailingComma: 'es5',
        });
    } catch (error) {
        // If that fails, try wrapping strategies
        const wrapResult = tryWrapCode(code);
        if (!wrapResult) {
            return code; // Return original if no strategy worked
        }

        try {
            const formatted = prettier.format(wrapResult.wrapped, {
                parser,
                printWidth: 120,
                tabWidth: 4,
                singleQuote: true,
                semi: true,
                trailingComma: 'es5',
            });
            return wrapResult.strategy.unwrap(formatted);
        } catch (wrapError) {
            // If even wrapped formatting fails, return original
            return code;
        }
    }
}

function getParserForLang(lang: string): string {
    const langMap: Record<string, string> = {
        js: 'babel',
        javascript: 'babel',
        jsx: 'babel',
        ts: 'typescript',
        typescript: 'typescript',
        tsx: 'typescript',
    };
    return langMap[lang.toLowerCase()] || 'babel';
}

export const printers: Record<string, Printer> = {};

const plugin: Plugin = {
    languages,
    parsers,
    printers,
};

export default plugin;
