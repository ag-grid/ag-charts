import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';

import { applyWrapper } from './wrappers';

function getSnippetPreview(code: string, maxLines = 6): string {
    const lines = code.trim().split('\n');
    if (lines.length <= maxLines) {
        return lines.join('\n');
    }
    return lines.slice(0, maxLines).join('\n') + '\n...';
}

interface CodeBlock {
    fullMatch: string;
    lang: string;
    code: string;
    startIndex: number;
    endIndex: number;
    lineNumber: number;
    meta?: string; // Metadata string after language (e.g., format="snippet")
}

/**
 * Validate that a file path is safe to process
 */
function validateFilePath(filePath: string): void {
    const resolvedPath = path.resolve(filePath);
    const cwd = process.cwd();

    // Ensure path is within the current working directory
    if (!resolvedPath.startsWith(cwd)) {
        throw new Error(`Path traversal detected: ${filePath} resolves outside of working directory`);
    }

    // Ensure it's an .mdoc file
    if (!filePath.endsWith('.mdoc')) {
        throw new Error(`Invalid file type: ${filePath} is not an .mdoc file`);
    }

    // Check for suspicious path components
    const pathComponents = filePath.split(path.sep);
    for (const component of pathComponents) {
        if (component === '..' || component.includes('\0')) {
            throw new Error(`Unsafe path component detected in: ${filePath}`);
        }
    }
}

/**
 * Extract all JavaScript/TypeScript code blocks from mdoc content
 */
function extractCodeBlocks(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    // Updated regex to capture optional metadata after language
    // Matches: ```js format="snippet" or ```js or ```javascript etc.
    // NOTE: Order matters - longer patterns must come first to prevent partial matches
    const codeBlockRegex = /```(javascript|typescript|json|jsx|tsx|js|ts)([\t\f\v \u00a0][^\n]*)?\n([\s\S]*?)```/g;

    // Calculate line numbers for all positions
    const lines = content.split('\n');
    const lineStarts: number[] = [0];
    for (let i = 0; i < lines.length - 1; i++) {
        lineStarts.push(lineStarts[i] + lines[i].length + 1);
    }

    function getLineNumber(index: number): number {
        for (let i = 0; i < lineStarts.length; i++) {
            if (index < lineStarts[i]) {
                return i; // Line numbers are 1-based for display
            }
        }
        return lineStarts.length;
    }

    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        const lineNumber = getLineNumber(match.index) + 1; // Convert to 1-based
        const meta = match[2] ? match[2].trim() : ''; // Optional metadata after language
        blocks.push({
            fullMatch: match[0],
            lang: match[1],
            code: match[3], // Code is now in capture group 3
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            lineNumber,
            meta: meta || undefined,
        });
    }

    return blocks;
}

/**
 * Parse metadata string to extract format strategy
 */
function parseMetadata(meta?: string): { format?: string } {
    if (!meta) return {};

    // Extract format strategy (supports both 'format' and deprecated 'wrapper')
    const formatMatch = meta.match(/(?:format|wrapper)=["']([^"']+)["']/);
    if (formatMatch) {
        return { format: formatMatch[1] };
    }

    return {};
}

/**
 * Check if code contains documentation placeholders that should not be formatted
 */
function containsDocumentationPlaceholders(code: string): boolean {
    const trimmed = code.trim();

    // Check for various placeholder patterns
    const placeholderPatterns = [
        /^{\s*\.\.\.\s*}$/, // { ... } or {...}
        /^\/\/\s*\.\.\.$/, // // ...
        /^\/\*\s*\.\.\.\s*\*\/$/, // /* ... */
        /^\.\.\.$/, // just ...
        // Object with ellipsis placeholder
        /^{\s*[^}]*\.\.\.\s*[^}]*}$/,
        // Array with ellipsis placeholder
        /^\[\s*[^\]]*\.\.\.\s*[^\]]*\]$/,
    ];

    // Enhanced patterns for mixed code and placeholders
    const mixedPlaceholderPatterns = [
        // Mixed assignment patterns like: const [state, setState] = useState({...});
        /=\s*useState\s*\(\s*{\s*\.\.\.\s*}\s*\)/,
        // Mixed reference patterns like: ref<AgChartOptions>({...})
        /ref<[^>]+>\s*\(\s*{\s*\.\.\.\s*}\s*\)/,
        // Direct assignment with placeholder: variable = {...}
        /\w+\s*=\s*{\s*\.\.\.\s*}/,
        // Function calls with placeholder objects: someFunc({...})
        /\w+\s*\(\s*{\s*\.\.\.\s*}\s*\)/,
        // Function body placeholder patterns
        /function\s+\w*\s*\([^)]*\)\s*{\s*\.\.\.\s*}/,
        /\([^)]*\)\s*=>\s*{\s*\.\.\.\s*}/,
        // Arrow function with placeholder body
        /\([^)]*\)\s*=>\s*\.\.\./,
    ];

    // Also check for lines containing comment placeholders
    const lines = code.split('\n').map((line) => line.trim());
    const hasCommentPlaceholders = lines.some(
        (line) =>
            /^\/\/\s*\.\.\.\s*$/.test(line) || // // ...
            /^\/\*\s*\.\.\.\s*\*\/$/.test(line) // /* ... */
    );

    // Return true if any placeholder pattern is found
    return (
        placeholderPatterns.some((pattern) => pattern.test(trimmed)) ||
        mixedPlaceholderPatterns.some((pattern) => pattern.test(code)) ||
        hasCommentPlaceholders
    );
}

/**
 * Format a single code block, handling partial code appropriately
 */
async function formatCodeBlock(code: string, lang: string, meta?: string): Promise<string> {
    // Parse metadata
    const metadata = parseMetadata(meta);

    // Skip formatting for documentation placeholders
    if (containsDocumentationPlaceholders(code)) {
        return code;
    }

    // Get prettier config from project
    const prettierConfig = (await prettier.resolveConfig(process.cwd())) ?? {};

    const normalizedLang = lang.toLowerCase();
    const extensionMap: Record<string, string> = {
        js: '.js',
        javascript: '.js',
        jsx: '.jsx',
        ts: '.ts',
        typescript: '.ts',
        tsx: '.tsx',
        json: '.json',
    };

    // For reactHooks format, use .tsx extension to properly handle JSX
    const effectiveExtension = metadata?.format === 'reactHooks' ? '.tsx' : extensionMap[normalizedLang] ?? '.js';
    const filepath = `snippet${effectiveExtension}`;

    // Determine the parser based on language and content
    const parserMap: Record<string, string> = {
        js: 'babel',
        javascript: 'babel',
        jsx: 'babel',
        ts: 'typescript',
        typescript: 'typescript',
        tsx: 'typescript',
        json: 'json',
    };

    // Auto-detect TypeScript syntax even in jsx/js blocks
    const hasTypeScriptSyntax =
        (/<[^>]+>/.test(code) && /[a-zA-Z_$][a-zA-Z0-9_$]*</.test(code)) || // Generic types like Type<Generic>
        /:\s*[a-zA-Z_$][a-zA-Z0-9_$]*(\[\]|\|)/.test(code) || // Type annotations
        /as\s+[a-zA-Z_$][a-zA-Z0-9_$]*/.test(code) || // Type assertions
        /interface\s+[a-zA-Z_$]/.test(code) || // Interface declarations
        /type\s+[a-zA-Z_$]/.test(code) || // Type alias declarations
        /\?\.\w/.test(code) || // Optional chaining
        /!\s*;/.test(code) || // Non-null assertion
        /document\.getElementById\([^)]+\)!/.test(code); // Non-null assertion on DOM elements

    let parser = parserMap[normalizedLang] ?? 'babel';

    // Override to TypeScript parser if TS syntax detected in JS/JSX blocks
    if (
        (normalizedLang === 'jsx' || normalizedLang === 'js' || normalizedLang === 'javascript') &&
        hasTypeScriptSyntax
    ) {
        parser = 'typescript';
    }

    // For reactHooks format, use TypeScript parser since we set .tsx extension
    if (metadata?.format === 'reactHooks') {
        parser = 'typescript';
    }

    // Override with specific settings for consistency
    const config: prettier.Options & Record<string, unknown> = {
        ...prettierConfig,
        parser,
        printWidth: 160,
        tabWidth: 4,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        filepath,
    };

    // For reactHooks format or tsx files, remove plugins that conflict with TypeScript parser
    // The import sorting plugin uses Babel parser internally which conflicts with TypeScript parser for JSX
    if (metadata?.format === 'reactHooks' || normalizedLang === 'tsx') {
        delete config.plugins;
        delete config.importOrder;
        delete config.importOrderParserPlugins;
        delete config.importOrderSeparation;
        delete config.importOrderSortSpecifiers;
    }

    // Check if original code had a trailing newline
    const hasTrailingNewline = code.endsWith('\n');
    const codeToFormat = hasTrailingNewline ? code.slice(0, -1) : code;

    // If format metadata specified, use it to ensure proper unwrapping (e.g., semicolon stripping)
    if (metadata.format && normalizedLang !== 'json') {
        const wrapResult = applyWrapper(codeToFormat, lang, metadata.format);
        if (!wrapResult) {
            const preview = getSnippetPreview(code);
            throw new Error(`Unknown format strategy "${metadata.format}". Preview:\n${preview}`);
        }

        try {
            const formatted = await prettier.format(wrapResult.wrapped, config);
            const unwrapped = wrapResult.strategy.unwrap(formatted);
            let result = unwrapped.replace(/\n$/, '');
            if (hasTrailingNewline) {
                result += '\n';
            }
            return result;
        } catch (error) {
            const preview = getSnippetPreview(code);
            const details: string[] = [];
            if (error instanceof Error && error.message) {
                details.push(`Error: ${error.message}`);
            }
            const detailText = details.length ? `\n${details.join('\n')}` : '';
            throw new Error(
                `Unable to format ${lang} code block with format "${metadata.format}". Preview:\n${preview}${detailText}`
            );
        }
    }

    // No wrapper specified, try to format as-is (complete code)
    try {
        const formatted = await prettier.format(codeToFormat, config);
        // Prettier adds a trailing newline, remove it
        let result = formatted.replace(/\n$/, '');
        if (hasTrailingNewline) {
            result += '\n';
        }
        return result;
    } catch (error) {
        // No wrapper specified, formatting failed
        const preview = getSnippetPreview(code);
        const details: string[] = [];
        if (error instanceof Error && error.message) {
            details.push(`Error: ${error.message}`);
        }
        const detailText = details.length ? `\n${details.join('\n')}` : '';
        throw new Error(
            `Unable to format ${lang} code block. Consider adding wrapper metadata. Preview:\n${preview}${detailText}`
        );
    }
}

/**
 * Process an mdoc file and format all code blocks
 */
export async function processMdocContent(
    content: string,
    filePath?: string
): Promise<{ formatted: string; changed: boolean }> {
    const blocks = extractCodeBlocks(content);

    if (blocks.length === 0) {
        return { formatted: content, changed: false };
    }

    let result = content;
    let offset = 0;
    let hasChanges = false;

    for (const block of blocks) {
        try {
            const formattedCode = await formatCodeBlock(block.code, block.lang, block.meta);

            if (formattedCode !== block.code) {
                hasChanges = true;

                // Reconstruct the code block with metadata
                const metaPart = block.meta ? ` ${block.meta}` : '';
                const codeWithNewline = formattedCode.endsWith('\n') ? formattedCode : formattedCode + '\n';
                const newBlock = `\`\`\`${block.lang}${metaPart}\n${codeWithNewline}\`\`\``;

                const adjustedStart = block.startIndex + offset;
                const adjustedEnd = block.endIndex + offset;

                result = result.substring(0, adjustedStart) + newBlock + result.substring(adjustedEnd);

                offset += newBlock.length - block.fullMatch.length;
            }
        } catch (error) {
            // Re-throw error with line number information
            const errorMessage = error instanceof Error ? error.message : String(error);
            const lineInfo = filePath ? `${filePath}:${block.lineNumber}` : `Line ${block.lineNumber}`;
            throw new Error(`${lineInfo}: ${errorMessage}`);
        }
    }

    return { formatted: result, changed: hasChanges };
}

/**
 * Format a .mdoc file in place
 */
export async function formatMdocFile(filePath: string): Promise<boolean> {
    validateFilePath(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { formatted, changed } = await processMdocContent(content, filePath);

    if (changed) {
        fs.writeFileSync(filePath, formatted, 'utf-8');
    }

    return changed;
}

/**
 * Check if a .mdoc file needs formatting
 */
export async function checkMdocFile(filePath: string): Promise<boolean> {
    validateFilePath(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { changed } = await processMdocContent(content, filePath);
    return changed;
}
