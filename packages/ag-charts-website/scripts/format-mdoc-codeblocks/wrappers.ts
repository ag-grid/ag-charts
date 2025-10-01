/**
 * Format strategies for formatting partial code snippets.
 * Each strategy wraps code to make it valid JS/TS for Prettier, then unwraps after formatting.
 *
 * Usage: Add format="strategyName" metadata to code blocks that need wrapping.
 * Example: ```js format="snippet"
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
 * For code snippets that may be partial objects, complete objects, or complete statements.
 * Intelligently detects the type and wraps only if needed.
 *
 * Use when: Code block contains object properties, object literals, or complete statements.
 *
 * Examples:
 * - `{ type: 'bar', xKey: 'month' }` (complete object)
 * - `type: 'bar', xKey: 'month'` (object properties without braces)
 * - `const x = 5;` (complete statement - not wrapped)
 */
const snippetStrategy: WrapStrategy = {
    name: 'snippet',
    wrap: (code: string) => {
        const trimmed = code.trim();

        // Check if this is a complete statement (const, let, var, import, export, function, class)
        // These don't need object wrapping - they're already valid code

        // First, strip leading comments
        const codeWithoutComments = trimmed.replace(/^(?:\/\/[^\n]*\n\s*)*/, '');

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

        // Check if this is a complete object or array literal that already has braces/brackets
        const isCompleteObject = trimmed.startsWith('{') && (trimmed.endsWith('}') || trimmed.endsWith('};'));
        const isCompleteArray = trimmed.startsWith('[') && (trimmed.endsWith(']') || trimmed.endsWith('];'));

        if (isCompleteObject || isCompleteArray) {
            // It's already a complete object/array, just assign it
            const hadSemicolon = trimmed.endsWith('};') || trimmed.endsWith('];');
            // For complete objects/arrays, only strip the trailing semicolon after the closing brace/bracket
            // Don't strip semicolons inside (they may be in function bodies)
            const fixedCode = hadSemicolon ? code.slice(0, -1) : code;
            return `// __HAD_SEMICOLON__:${hadSemicolon}\nconst __temp__ = ${fixedCode}`;
        }

        // Check if this is a property assignment (key: value or key: {...} or key: [...])
        // These need to be wrapped in an object but we should strip trailing semicolons
        const propertyPattern = /^\s*[\w$]+\s*:\s*/;
        if (propertyPattern.test(trimmed)) {
            // Check if it's an array property containing objects with braces (e.g., series: [{ ... }])
            // This handles both single-line and multi-line arrays
            const arrayWithObjectPattern = /^\s*[\w$]+\s*:\s*\[[\s\S]*\{[\s\S]*\}[\s\S]*\]\s*;?\s*$/;
            if (arrayWithObjectPattern.test(trimmed)) {
                // It's a property with array of objects - wrap it and preserve structure
                const hadSemicolon = trimmed.endsWith(';');
                const fixedCode = hadSemicolon ? code.slice(0, -1) : code;
                return `// __PRESERVE_BRACES__:true\nconst __temp__ = {\n${fixedCode}\n};`;
            }

            // Check if it's an object property (e.g., tooltip: { ... })
            // This handles both single-line and multi-line objects
            const objectPropertyPattern = /^\s*[\w$]+\s*:\s*\{[\s\S]*\}\s*;?\s*$/;
            if (objectPropertyPattern.test(trimmed)) {
                // It's a property with object value - wrap it and preserve structure
                const hadSemicolon = trimmed.endsWith(';');
                const fixedCode = hadSemicolon ? code.slice(0, -1) : code;
                return `// __PRESERVE_BRACES__:true\nconst __temp__ = {\n${fixedCode}\n};`;
            }

            // It's a property assignment
            // Strip semicolons: both at end of line and before comments
            // Handle: padding: 4; //comment -> padding: 4, //comment
            // Handle: series: [...]; -> series: [...]
            const fixedCode = code.replace(/;(\s*(?:\/\/[^\n]*)?)$/gm, '$1');
            return `const __temp__ = {\n${fixedCode}\n};`;
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

        // Handle object properties with preserved braces (e.g., series: [{ ... }])
        const preserveBracesMatch = formatted.match(/\/\/ __PRESERVE_BRACES__:true\n/);
        if (preserveBracesMatch) {
            formatted = formatted.replace(/\/\/ __PRESERVE_BRACES__:true\n/, '');

            const prefixMatch = formatted.match(/^const __temp__ = {\n/);
            if (prefixMatch) {
                let body = formatted.slice(prefixMatch[0].length);
                body = body.replace(/\r?\n};\s*$/, '');

                const lines = body.split('\n');

                const trimmedLines = trimEmptyEdgeLines(lines);
                const dedentedLines = removeCommonIndent(trimmedLines);
                let result = dedentedLines.join('\n');
                // Don't strip trailing comma/semicolon for preserved braces - Prettier adds commas for object properties

                // For preserved braces, wrap result back in braces with proper indentation
                const indentedLines = result.split('\n').map((line) => (line.trim() ? `    ${line}` : line));
                return `{\n${indentedLines.join('\n')}\n}`;
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
        const codeWithoutComments = trimmed.replace(/^(?:\/\/[^\n]*\n\s*)*/, '');

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
        const hasReturn = /\breturn\s+[(<]/.test(code);
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
 * Use the strategy name in code block metadata: ```js format="snippet"
 */
export const wrapperStrategies: Record<string, WrapStrategy> = {
    snippet: snippetStrategy,
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
