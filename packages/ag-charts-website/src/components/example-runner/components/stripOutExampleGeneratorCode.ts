import { CONSOLE_LOG_REGEX, DARK_MODE_REGEX, E2E_THEME_REGEX } from '@ag-website-shared/utils/extraCodeSnippets';
import type { FileContents } from '@components/example-generator/types';

import { E2E_STYLE_END, E2E_STYLE_START } from '../constants';

const MAIN_FILES = ['main.js', 'main.ts', 'index.tsx', 'index.jsx', 'app.component.ts'];

function getSnippetRegex({ startDelimiter, endDelimiter }: { startDelimiter: string; endDelimiter: string }) {
    const escapedStart = startDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedEnd = endDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\s*${escapedStart}[\\s\\S]*?${escapedEnd}\\s*`, 'g');

    return regex;
}

/**
 * Strip the harness code the example generator injects (dark-mode switcher, console
 * logging, e2e theme setup, and the synthetic `head.html` fragment) so the reader sees
 * the same clean source as the on-page code viewer. Mutates `files` in place.
 */
export function stripOutExampleGeneratorCode(files: FileContents) {
    MAIN_FILES.forEach((mainFile) => {
        if (files[mainFile]) {
            files[mainFile] =
                files[mainFile]
                    .replace(DARK_MODE_REGEX, '')
                    .replace(CONSOLE_LOG_REGEX, '')
                    .replace(E2E_THEME_REGEX, '')
                    .trim() + '\n';
        }
    });

    const e2eStyleRegex = getSnippetRegex({ startDelimiter: E2E_STYLE_START, endDelimiter: E2E_STYLE_END });

    if (files['index.html']) {
        files['index.html'] = files['index.html']?.replace(e2eStyleRegex, '').trim();
    }

    // `head.html` is a synthetic fragment injected into the document `<head>`, not a project
    // file — the rendered host page already includes its contents, so exports must not carry it.
    delete files['head.html'];
}
