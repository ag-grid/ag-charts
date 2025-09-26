import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';

import { tryWrapCode } from './wrappers';

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
    lineNumber: number; // Line number where the code block starts
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
    const codeBlockRegex = /```(js|javascript|jsx|ts|typescript|tsx)\n([\s\S]*?)```/g;

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
        blocks.push({
            fullMatch: match[0],
            lang: match[1],
            code: match[2],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            lineNumber,
        });
    }

    return blocks;
}

/**
 * Check if code contains documentation placeholders that should not be formatted
 */
function containsDocumentationPlaceholders(code: string): boolean {
    const trimmed = code.trim();

    // Early check for partial object patterns ending with }); or }),
    // This specifically handles documentation shorthand for object properties in function calls
    if (trimmed.startsWith('{') && trimmed.endsWith('});')) {
        return true;
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}),')) {
        return true;
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}];')) {
        return true;
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}],')) {
        return true;
    }

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

    // Partial object patterns (documentation shorthand for objects in function context)
    // These patterns detect objects that appear to be parts of larger expressions
    const partialObjectPatterns = [
        /^\s*\{[\s\S]*?\}\s*\)\s*;?\s*$/, // { ... }); or { ... })
        /^\s*\{[\s\S]*?\}\s*,\s*$/, // { ... }, - partial object in array
        /^\s*\{[\s\S]*?\}\s*\]\s*;?\s*$/, // { ... }]; - partial object ending array
        /^\s*\{[\s\S]*?\}\s*\]\s*,\s*$/, // { ... }], - partial object ending array with comma
    ];

    // Enhanced patterns for mixed code and placeholders
    const mixedPlaceholderPatterns = [
        // Mixed assignment patterns like: const [state, setState] = useState({...});
        /=\s*useState\s*\(\s*{\s*\.\.\.\s*}\s*\)/,
        // Mixed reference patterns like: ref<AgChartOptions>({...})
        /ref<[^>]+>\s*\(\s*{\s*\.\.\.\s*}\s*\)/,
        // Direct assignment with placeholder: variable = {...}
        /\w+\s*=\s*{\s*\.\.\.\s*}/,
        // Object property with placeholder: label: {...}
        /\w+\s*:\s*{\s*\.\.\.\s*}/,
        // Function calls with placeholder objects: someFunc({...})
        /\w+\s*\(\s*{\s*\.\.\.\s*}\s*\)/,
        // Type annotations with placeholders: Type<{...}>
        /<[^>]*{\s*\.\.\.\s*}[^>]*>/,
        // Function body placeholder patterns
        /function\s+\w*\s*\([^)]*\)\s*{\s*\.\.\.\s*}/,
        /\([^)]*\)\s*=>\s*{\s*\.\.\.\s*}/,
        // Arrow function with placeholder body
        /\([^)]*\)\s*=>\s*\.\.\./,
        // Method with placeholder body
        /\w+\s*\([^)]*\)\s*{\s*\.\.\.\s*}/,
    ];

    // TypeScript-style type placeholders
    const typeScriptPlaceholderPatterns = [
        // Generic type with ellipsis: <...>
        /^<\s*\.\.\.\s*>$/,
        // Type definition with ellipsis: Type<...>
        /\w+<\s*\.\.\.\s*>/,
        // Interface or type alias with placeholder
        /:\s*{\s*\.\.\.\s*}[;\s]*$/,
        // Generic constraints with placeholders
        /<[^>]*\.\.\.[^>]*>/,
    ];

    // Check for inline placeholders within larger code blocks
    const inlinePlaceholderPatterns = [
        // Lines ending with placeholder comments
        /\/\/\s*\.\.\.\s*$/m,
        // Lines with only placeholder comments
        /^\s*\/\/\s*\.\.\.\s*$/m,
        // Block comments with placeholders
        /\/\*\s*\.\.\.\s*\*\//,
        // Object spread with placeholder
        /\.\.\.\s*{\s*\.\.\.\s*}/,
        // Array spread with placeholder
        /\.\.\.\s*\[\s*\.\.\.\s*\]/,
    ];

    // Function body placeholder detection - more specific patterns
    const functionBodyPlaceholderPatterns = [
        // Function with only placeholder body
        /function\s+\w*\s*\([^)]*\)\s*{\s*\/\/\s*\.\.\.\s*}/,
        /\w+\s*\([^)]*\)\s*{\s*\/\/\s*\.\.\.\s*}/, // method
        // Arrow functions with placeholder
        /=>\s*{\s*\/\/\s*\.\.\.\s*}/,
        /=>\s*\/\/\s*\.\.\./,
    ];

    // Also check for lines containing comment placeholders
    const lines = code.split('\n').map((line) => line.trim());
    const hasCommentPlaceholders = lines.some(
        (line) =>
            /^\/\/\s*\.\.\.\s*$/.test(line) || // // ...
            /^\/\*\s*\.\.\.\s*\*\/$/.test(line) // /* ... */
    );

    // Check if the entire block is primarily placeholder content
    const placeholderLineCount = lines.filter(
        (line) =>
            /\/\/\s*\.\.\.\s*$/.test(line) ||
            /\/\*\s*\.\.\.\s*\*\//.test(line) ||
            /^{\s*\.\.\.\s*}$/.test(line) ||
            /^\.\.\.$/.test(line)
    ).length;

    const totalNonEmptyLines = lines.filter((line) => line.length > 0).length;
    const isPrimarilyPlaceholders = totalNonEmptyLines > 0 && placeholderLineCount / totalNonEmptyLines > 0.5;

    // Return true if any placeholder pattern is found
    return (
        placeholderPatterns.some((pattern) => pattern.test(trimmed)) ||
        partialObjectPatterns.some((pattern) => pattern.test(trimmed)) ||
        mixedPlaceholderPatterns.some((pattern) => pattern.test(code)) ||
        typeScriptPlaceholderPatterns.some((pattern) => pattern.test(code)) ||
        inlinePlaceholderPatterns.some((pattern) => pattern.test(code)) ||
        functionBodyPlaceholderPatterns.some((pattern) => pattern.test(code)) ||
        hasCommentPlaceholders ||
        isPrimarilyPlaceholders
    );
}

/**
 * Format a single code block in debug mode - attaches wrapped code to errors
 */
async function formatCodeBlockDebug(code: string, lang: string): Promise<string> {
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
    };
    const filepath = `snippet${extensionMap[normalizedLang] ?? '.js'}`;

    // Determine the parser based on language and content
    const parserMap: Record<string, string> = {
        js: 'babel',
        javascript: 'babel',
        jsx: 'babel',
        ts: 'typescript',
        typescript: 'typescript',
        tsx: 'typescript',
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

    // Override with specific settings for consistency
    const config = {
        ...prettierConfig,
        parser,
        printWidth: 120,
        tabWidth: 4,
        semi: true,
        singleQuote: true, // Keep single quotes as default for consistency
        trailingComma: 'es5' as const,
        filepath,
    };

    // Check if original code had a trailing newline
    const hasTrailingNewline = code.endsWith('\n');
    const codeToFormat = hasTrailingNewline ? code.slice(0, -1) : code;

    // First, try to format as-is (complete code)
    try {
        const formatted = await prettier.format(codeToFormat, config);
        // Prettier adds a trailing newline, remove it
        let result = formatted.replace(/\n$/, '');
        if (hasTrailingNewline) {
            result += '\n';
        }
        return result;
    } catch (error) {
        // Try wrapping the code for partial snippets
        const wrapResult = tryWrapCode(codeToFormat, lang);
        if (!wrapResult) {
            const preview = getSnippetPreview(code);
            const details: string[] = [];
            if (error instanceof Error && error.message) {
                details.push(`Original error: ${error.message}`);
            }
            const detailText = details.length ? `\n${details.join('\n')}` : '';
            const err = new Error(
                `Unable to format ${lang} code block. No wrap strategy matched. Preview:\n${preview}${detailText}`
            );
            // Attach original code for debug output
            (err as any).wrappedCode = code;
            throw err;
        }

        try {
            const formatted = await prettier.format(wrapResult.wrapped, config);
            const unwrapped = wrapResult.strategy.unwrap(formatted);
            let result = unwrapped.replace(/\n$/, '');
            if (hasTrailingNewline) {
                result += '\n';
            }
            return result;
        } catch (error2) {
            const preview = getSnippetPreview(code);
            const details: string[] = [];
            if (error instanceof Error && error.message) {
                details.push(`Original error: ${error.message}`);
            }
            if (error2 instanceof Error && error2.message) {
                details.push(`Wrapped error: ${error2.message}`);
            }
            const detailText = details.length ? `\n${details.join('\n')}` : '';
            const err = new Error(
                `Unable to format ${lang} code block with wrap strategy "${wrapResult.strategy.name}". Preview:\n${preview}${detailText}`
            );
            // Attach wrapped code for debug output
            (err as any).wrappedCode = wrapResult.wrapped;
            throw err;
        }
    }
}

/**
 * Format a single code block, handling partial code appropriately
 */
async function formatCodeBlock(code: string, lang: string): Promise<string> {
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
    };
    const filepath = `snippet${extensionMap[normalizedLang] ?? '.js'}`;

    // Determine the parser based on language and content
    const parserMap: Record<string, string> = {
        js: 'babel',
        javascript: 'babel',
        jsx: 'babel',
        ts: 'typescript',
        typescript: 'typescript',
        tsx: 'typescript',
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

    // Override with specific settings for consistency
    const config = {
        ...prettierConfig,
        parser,
        printWidth: 120,
        tabWidth: 4,
        semi: true,
        trailingComma: 'es5' as const,
        filepath,
    };

    // Check if original code had a trailing newline
    const hasTrailingNewline = code.endsWith('\n');
    const codeToFormat = hasTrailingNewline ? code.slice(0, -1) : code;

    // First, try to format as-is (complete code)
    try {
        const formatted = await prettier.format(codeToFormat, config);
        // Prettier adds a trailing newline, remove it
        let result = formatted.replace(/\n$/, '');
        if (hasTrailingNewline) {
            result += '\n';
        }
        return result;
    } catch (error) {
        const wrapResult = tryWrapCode(codeToFormat, lang);

        if (!wrapResult) {
            const preview = getSnippetPreview(codeToFormat);
            const details: string[] = [];
            if (error instanceof Error && error.message) {
                details.push(`Original error: ${error.message}`);
            }
            const detailText = details.length ? `\n${details.join('\n')}` : '';
            throw new Error(
                `Unable to format ${lang} code block. No wrap strategy matched. Preview:\n${preview}${detailText}`
            );
        }

        try {
            const formatted = await prettier.format(wrapResult.wrapped, config);
            const unwrapped = wrapResult.strategy.unwrap(formatted);
            let result = unwrapped.replace(/\n$/, '');
            if (hasTrailingNewline) {
                result += '\n';
            }
            return result;
        } catch (error2) {
            const preview = getSnippetPreview(codeToFormat);
            const details: string[] = [];
            if (error instanceof Error && error.message) {
                details.push(`Original error: ${error.message}`);
            }
            if (error2 instanceof Error && error2.message) {
                details.push(`Wrapped error: ${error2.message}`);
            }
            const detailText = details.length ? `\n${details.join('\n')}` : '';
            throw new Error(
                `Unable to format ${lang} code block with wrap strategy "${wrapResult.strategy.name}". Preview:\n${preview}${detailText}`
            );
        }
    }
}

/**
 * Process an mdoc file and format all code blocks in debug mode
 * Writes wrapped code back to source on failure for debugging
 */
async function processMdocContentDebug(
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
            const formattedCode = await formatCodeBlockDebug(block.code, block.lang);

            if (formattedCode !== block.code) {
                hasChanges = true;

                // Ensure there's a newline before the closing ``` markers
                const codeWithNewline = formattedCode.endsWith('\n') ? formattedCode : formattedCode + '\n';
                const newBlock = `\`\`\`${block.lang}\n${codeWithNewline}\`\`\``;

                const adjustedStart = block.startIndex + offset;
                const adjustedEnd = block.endIndex + offset;

                result = result.substring(0, adjustedStart) + newBlock + result.substring(adjustedEnd);

                offset += newBlock.length - block.fullMatch.length;
            }
        } catch (error) {
            // In debug mode, don't throw - just log the error
            const errorMessage = error instanceof Error ? error.message : String(error);
            const lineInfo = filePath ? `${filePath}:${block.lineNumber}` : `Line ${block.lineNumber}`;
            console.error(`DEBUG: ${lineInfo}: ${errorMessage}`);

            // Replace with wrapped/debug code if available
            if (error instanceof Error && (error as any).wrappedCode) {
                hasChanges = true;
                const debugCode = `// DEBUG: Failed to format - showing wrapped code\n${(error as any).wrappedCode}`;
                const codeWithNewline = debugCode.endsWith('\n') ? debugCode : debugCode + '\n';
                const newBlock = `\`\`\`${block.lang}\n${codeWithNewline}\`\`\``;

                const adjustedStart = block.startIndex + offset;
                const adjustedEnd = block.endIndex + offset;

                result = result.substring(0, adjustedStart) + newBlock + result.substring(adjustedEnd);

                offset += newBlock.length - block.fullMatch.length;
            }
        }
    }

    return { formatted: result, changed: hasChanges };
}

/**
 * Process an mdoc file and format all code blocks
 */
async function processMdocContent(
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
            const formattedCode = await formatCodeBlock(block.code, block.lang);

            if (formattedCode !== block.code) {
                hasChanges = true;

                // Ensure there's a newline before the closing ``` markers
                const codeWithNewline = formattedCode.endsWith('\n') ? formattedCode : formattedCode + '\n';
                const newBlock = `\`\`\`${block.lang}\n${codeWithNewline}\`\`\``;

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

/**
 * Format a .mdoc file in debug mode - writes wrapped code on failure
 */
export async function formatMdocFileDebug(filePath: string): Promise<boolean> {
    validateFilePath(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { formatted, changed } = await processMdocContentDebug(content, filePath);

    if (changed || formatted !== content) {
        fs.writeFileSync(filePath, formatted, 'utf-8');
        return true;
    }

    return false;
}
