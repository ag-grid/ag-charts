/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';

import { getParserForLang } from './utils';
import { tryWrapCode } from './wrappers';

interface CodeBlock {
    fullMatch: string;
    lang: string;
    code: string;
    startIndex: number;
    endIndex: number;
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

    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        blocks.push({
            fullMatch: match[0],
            lang: match[1],
            code: match[2],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });
    }

    return blocks;
}

/**
 * Format a single code block, handling partial code appropriately
 */
async function formatCodeBlock(code: string, lang: string): Promise<string> {
    const parser = getParserForLang(lang);

    // Get prettier config from project
    const prettierConfig = (await prettier.resolveConfig(process.cwd())) ?? {};

    // Override with specific settings for consistency
    const config = {
        ...prettierConfig,
        parser,
        printWidth: 120,
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        trailingComma: 'es5' as const,
    };

    // Check if original code had a trailing newline
    const hasTrailingNewline = code.endsWith('\n');
    const codeToFormat = hasTrailingNewline ? code.slice(0, -1) : code;

    // First, try to format as-is (complete code)
    try {
        const formatted = await prettier.format(codeToFormat, config);
        // Prettier adds a trailing newline, remove it
        let result = formatted.replace(/\n$/, '');
        // Add back the trailing newline if original had it
        if (hasTrailingNewline) {
            result += '\n';
        }
        return result;
    } catch (error) {
        // If that fails, try wrapping strategies for partial code
        // Note: Expected for partial code that needs wrapping
        console.debug(
            'Initial formatting failed, trying wrap strategies:',
            error instanceof Error ? error.message : String(error)
        );
        const wrapResult = tryWrapCode(codeToFormat);

        if (!wrapResult) {
            // If no strategy works, return original code
            return code;
        }

        try {
            const formatted = await prettier.format(wrapResult.wrapped, config);
            const unwrapped = wrapResult.strategy.unwrap(formatted);
            // Remove any trailing newline from the unwrapped result
            let result = unwrapped.replace(/\n$/, '');
            // Add back the trailing newline if original had it
            if (hasTrailingNewline) {
                result += '\n';
            }
            return result;
        } catch (error2) {
            // If even wrapped formatting fails, return original
            console.debug(
                'Wrapped formatting also failed, returning original code:',
                error2 instanceof Error ? error2.message : String(error2)
            );
            return code;
        }
    }
}

/**
 * Process an mdoc file and format all code blocks
 */
async function processMdocContent(content: string): Promise<{ formatted: string; changed: boolean }> {
    const blocks = extractCodeBlocks(content);

    if (blocks.length === 0) {
        return { formatted: content, changed: false };
    }

    let result = content;
    let offset = 0;
    let hasChanges = false;

    for (const block of blocks) {
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
    }

    return { formatted: result, changed: hasChanges };
}

/**
 * Format a .mdoc file in place
 */
export async function formatMdocFile(filePath: string): Promise<boolean> {
    validateFilePath(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { formatted, changed } = await processMdocContent(content);

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
    const { changed } = await processMdocContent(content);
    return changed;
}
