/**
 * Format strategies for formatting partial code snippets.
 * Each strategy wraps code to make it valid JS/TS for Prettier, then unwraps after formatting.
 *
 * Usage: Add format="strategyName" metadata to code blocks that need wrapping.
 * Example: ```js format="object"
 */

export interface WrapStrategy {
    name: string;
    wrap: (code: string, lang: string) => string;
    unwrap: (formatted: string) => string;
}

function removeCommonIndent(lines: string[]): string[] {
    const nonEmptyIndents = lines.filter((line) => line.trim() !== '').map((line) => line.match(/^[\t ]*/)?.[0] ?? '');

    if (nonEmptyIndents.length === 0) {
        return lines;
    }

    let commonPrefix = nonEmptyIndents[0];
    for (const indent of nonEmptyIndents.slice(1)) {
        while (!indent.startsWith(commonPrefix) && commonPrefix.length > 0) {
            commonPrefix = commonPrefix.slice(0, -1);
        }
        if (commonPrefix.length === 0) {
            break;
        }
    }

    if (commonPrefix.length === 0) {
        return lines;
    }

    return lines.map((line) => (line.startsWith(commonPrefix) ? line.slice(commonPrefix.length) : line));
}

function trimEmptyEdgeLines(lines: string[]): string[] {
    let start = 0;
    let end = lines.length;

    while (start < end && lines[start].trim() === '') {
        start++;
    }

    while (end > start && lines[end - 1].trim() === '') {
        end--;
    }

    return lines.slice(start, end);
}

/**
 * For bare object literals that are meant to be assigned to a variable.
 * Use when: Code block contains just object properties or a complete object literal.
 *
 * Examples:
 * - `{ type: 'bar', xKey: 'month' }` (complete object)
 * - `type: 'bar', xKey: 'month'` (object properties without braces)
 */
const objectStrategy: WrapStrategy = {
    name: 'object',
    wrap: (code: string) => {
        const trimmed = code.trim();

        // Check if this is a complete statement (const, let, var, import, export, function, class)
        // These don't need object wrapping - they're already valid code

        // First, strip leading comments
        let codeWithoutComments = trimmed.replace(/^(?:\/\/[^\n]*\n\s*)*/, '');

        // Check for decorators (after stripping comments)
        const hasDecorator = /^@\w+/.test(codeWithoutComments);
        if (hasDecorator) {
            // Look for statement keywords after any decorator and its closing parens/braces
            const hasStatementAfterDecorator =
                /^\s*(const|let|var|import|export|function|class|interface|type)\s/m.test(codeWithoutComments);
            if (hasStatementAfterDecorator) {
                return code;
            }
        }

        // For code without decorators, check if it starts with a statement keyword
        const startsWithStatement = /^(const|let|var|import|export|function|class|interface|type)\s/.test(
            codeWithoutComments
        );
        if (startsWithStatement) {
            return code;
        }

        // Check if this is a complete object literal that already has braces
        if (trimmed.startsWith('{') && (trimmed.endsWith('}') || trimmed.endsWith('};'))) {
            // It's already a complete object, just assign it
            const hadSemicolon = trimmed.endsWith('};');
            // For complete objects, only strip the trailing semicolon after the closing brace
            // Don't strip semicolons inside (they may be in function bodies)
            const fixedCode = hadSemicolon ? code.slice(0, -1) : code;
            return `// __HAD_SEMICOLON__:${hadSemicolon}\nconst __temp__ = ${fixedCode}`;
        }

        // Otherwise, it's object properties without braces
        // Strip semicolons from simple property lines (invalid syntax in objects)
        // Only strip semicolons that appear to be at the end of property declarations
        // Match: key: value; or key: value; //comment
        // Don't match semicolons inside braces (function bodies, nested objects)
        const fixedCode = code.replace(/^(\s*\w+\s*:\s*[^{;]+);(\s*(?:\/\/[^\n]*)?)$/gm, '$1$2');
        return `const __temp__ = {\n${fixedCode}\n};`;
    },
    unwrap: (formatted: string) => {
        // Handle complete objects (with marker comment) - check this FIRST before complete statement check
        const hadSemicolonMatch = formatted.match(/\/\/ __HAD_SEMICOLON__:(true|false)\n/);
        if (hadSemicolonMatch) {
            formatted = formatted.replace(/\/\/ __HAD_SEMICOLON__:(true|false)\n/, '');

            const match = formatted.match(/^const __temp__ = ([\s\S]+)$/);
            if (match) {
                let obj = match[1].trim();
                obj = obj.replace(/[;,](\s*)$/, '$1');
                return obj;
            }
        }

        // Handle object properties (without braces) - check this SECOND before complete statement check
        const prefixMatch = formatted.match(/^const __temp__ = {\n/);
        if (prefixMatch) {
            let body = formatted.slice(prefixMatch[0].length);
            body = body.replace(/\r?\n};\s*$/, '');

            const lines = body.split('\n');

            const trimmedLines = trimEmptyEdgeLines(lines);
            const dedentedLines = removeCommonIndent(trimmedLines);
            let result = dedentedLines.join('\n');
            result = result.replace(/[;,](\s*)$/, '$1');

            return result;
        }

        // Handle complete statements (no wrapping was done) - check this LAST
        const trimmed = formatted.trim();

        // First, strip leading comments
        let codeWithoutComments = trimmed.replace(/^(?:\/\/[^\n]*\n\s*)*/, '');

        // Check for decorators (after stripping comments)
        const hasDecorator = /^@\w+/.test(codeWithoutComments);
        if (hasDecorator) {
            const hasStatementAfterDecorator =
                /^\s*(const|let|var|import|export|function|class|interface|type)\s/m.test(codeWithoutComments);
            if (hasStatementAfterDecorator) {
                return formatted;
            }
        }

        // For code without decorators, check if it starts with a statement keyword
        const startsWithStatement = /^(const|let|var|import|export|function|class|interface|type)\s/.test(
            codeWithoutComments
        );
        if (startsWithStatement) {
            return formatted;
        }

        // If we get here, something unexpected happened, return as-is
        return formatted;
    },
};

/**
 * For React hooks that need component context.
 * Use when: Code block contains useState, useEffect, or other hooks without a component.
 *
 * Examples:
 * - `const [value, setValue] = useState(0);`
 * - `useEffect(() => { ... }, []);`
 * - Multiple hooks used together
 */
const reactHooksStrategy: WrapStrategy = {
    name: 'reactHooks',
    wrap: (code: string) => {
        // Add React import if not present
        const hasReactImport = /import\s+(?:\*\s+as\s+)?React/.test(code);
        const importLine = hasReactImport ? '' : "import React from 'react';\n\n";

        // Check if code already has a return statement
        const hasReturn = /\breturn\s+[\(\<]/.test(code);
        const returnStatement = hasReturn ? '' : '\n    return null;';

        return `${importLine}function Component() {\n${code}${returnStatement}\n}`;
    },
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');

        // Remove added React import if we added it
        const importIdx = lines.findIndex((line) => line === "import React from 'react';");
        if (importIdx !== -1 && lines[importIdx + 1] === '') {
            lines.splice(importIdx, 2);
        }

        // Find component body
        const startIdx = lines.findIndex((line) => line.includes('function Component() {'));

        if (startIdx === -1) {
            return formatted;
        }

        // Try to find our added return null first
        const returnNullIdx = lines.findIndex((line) => line.trim() === 'return null;');

        // Find the last closing brace (the component's closing brace)
        let endIdx = lines.length - 1;
        while (endIdx > startIdx && lines[endIdx].trim() !== '}') {
            endIdx--;
        }

        // If we found return null, use that as the end, otherwise use the line before the closing brace
        const contentEndIdx = returnNullIdx !== -1 ? returnNullIdx : endIdx;

        // Get lines between function declaration and end
        let content = lines.slice(startIdx + 1, contentEndIdx);

        // Remove empty lines at the end
        while (content.length > 0 && content[content.length - 1].trim() === '') {
            content.pop();
        }

        // Remove common indentation (Prettier indents code inside the function)
        content = removeCommonIndent(content);

        return content.join('\n');
    },
};

/**
 * Map of all available format strategies.
 * Use the strategy name in code block metadata: ```js format="object"
 */
export const wrapperStrategies: Record<string, WrapStrategy> = {
    object: objectStrategy,
    reactHooks: reactHooksStrategy,
};

/**
 * Apply a wrapper strategy by name.
 * Returns null if the strategy doesn't exist.
 */
export function applyWrapper(
    code: string,
    lang: string,
    strategyName: string
): { wrapped: string; strategy: WrapStrategy } | null {
    const strategy = wrapperStrategies[strategyName];
    if (!strategy) {
        return null;
    }
    return {
        wrapped: strategy.wrap(code, lang),
        strategy,
    };
}
