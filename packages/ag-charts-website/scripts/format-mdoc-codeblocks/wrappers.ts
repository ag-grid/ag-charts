export interface WrapStrategy {
    name: string;
    wrap: (code: string, lang: string) => string;
    unwrap: (formatted: string) => string;
    canHandle: (code: string, lang: string) => boolean;
}

/**
 * Helper function to check if code contains documentation placeholders
 * This is a simplified version of the function in formatter.ts for use in wrap strategies
 */
function hasPlaceholderPatterns(code: string): boolean {
    const trimmed = code.trim();

    // Basic placeholder patterns that indicate documentation shorthand
    const basicPatterns = [
        /{\s*\.\.\.\s*}/, // {...}
        /\[\s*\.\.\.\s*\]/, // [...]
        /\/\/\s*\.\.\.\s*$/, // // ... (end of line)
        /^\s*\/\/\s*\.\.\.\s*$/, // // ... (whole line)
        /\/\*\s*\.\.\.\s*\*\//, // /* ... */
        /=\s*useState\s*\(\s*{\s*\.\.\.\s*}\s*\)/, // useState({...})
        /ref<[^>]+>\s*\(\s*{\s*\.\.\.\s*}\s*\)/, // ref<Type>({...})
        /\w+\s*=\s*{\s*\.\.\.\s*}/, // variable = {...}
        /function\s+\w*\s*\([^)]*\)\s*{\s*\.\.\.\s*}/, // function() { ... }
        /=>\s*{\s*\.\.\.\s*}/, // => { ... }
        /=>\s*\.\.\./, // => ...
    ];

    // Partial object patterns (documentation shorthand for objects in function context)
    // These patterns detect objects that appear to be parts of larger expressions
    const partialObjectPatterns = [
        /^\s*\{[\s\S]*?\}\s*\)\s*;?\s*$/, // { ... }); or { ... })
        /^\s*\{[\s\S]*?\}\s*,\s*$/, // { ... }, - partial object in array
        /^\s*\{[\s\S]*?\}\s*\]\s*;?\s*$/, // { ... }]; - partial object ending array
        /^\s*\{[\s\S]*?\}\s*\]\s*,\s*$/, // { ... }], - partial object ending array with comma
    ];

    return (
        basicPatterns.some((pattern) => pattern.test(code)) ||
        partialObjectPatterns.some((pattern) => pattern.test(trimmed))
    );
}

/**
 * Strategy for wrapping function body code
 */
const functionWrapStrategy: WrapStrategy = {
    name: 'function',
    wrap: (code: string, _lang: string) => `function __temp__() {\n${code}\n}`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            // Remove first and last lines (function declaration and closing brace)
            // Also remove the 4-space indentation added by the function body
            return lines
                .slice(1, -1)
                .map((line) => line.replace(/^\s{4}/, ''))
                .join('\n');
        }
        return formatted;
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        // Don't try to wrap placeholder patterns
        if (hasPlaceholderPatterns(code)) {
            return false;
        }
        if (/^(const|let|var|class|function|import|export)\b/.test(trimmed)) {
            return false;
        }
        return (
            trimmed.startsWith('return') ||
            trimmed.startsWith('if') ||
            trimmed.startsWith('for') ||
            trimmed.startsWith('while') ||
            trimmed.includes('=>') ||
            trimmed.includes('switch') ||
            trimmed.includes('try') ||
            trimmed.includes('throw')
        );
    },
};

/**
 * Strategy for wrapping object properties
 */
const objectWrapStrategy: WrapStrategy = {
    name: 'object',
    wrap: (code: string, _lang: string) => {
        // Always wrap as an object property - this is the most reliable approach
        // Use replace with regex for better performance on large strings
        const indentedCode = code.replace(/^/gm, '    ');
        return `const __temp__ = {\n    // __ORIGINAL_START__\n    ${indentedCode}\n    // __ORIGINAL_END__\n};`;
    },
    unwrap: (formatted: string) => {
        // Remove the wrapper comments and extract the original code
        const startMarker = '// __ORIGINAL_START__';
        const endMarker = '// __ORIGINAL_END__';

        const startIndex = formatted.indexOf(startMarker);
        const endIndex = formatted.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
            // Extract content between markers
            const afterStart = formatted.substring(startIndex + startMarker.length);
            const contentEnd = afterStart.indexOf(endMarker);
            if (contentEnd !== -1) {
                let content = afterStart.substring(0, contentEnd);

                // Remove the indentation that was added
                const lines = content.split('\n');
                // Filter out empty lines at start and end
                const nonEmptyLines = lines.filter((line, idx) => {
                    // Keep all non-empty lines and lines in the middle
                    return line.trim() !== '' || (idx > 0 && idx < lines.length - 1);
                });
                content = nonEmptyLines
                    .map((line) => line.replace(/^\s{4}/, ''))
                    .join('\n')
                    .trim();

                // Prettier adds a comma after the object property when it's wrapped
                // We need to remove it if it's there, but avoid adding semicolons
                if (content.endsWith(',')) {
                    content = content.slice(0, -1).trimEnd();
                }

                // Also check for semicolons that may have been incorrectly added
                // and remove them if they appear after closing braces
                content = content.replace(/(\});\s*$/, '$1');

                return content;
            }
        }

        // Fallback to old unwrap logic if markers not found
        const lines = formatted.split('\n');
        if (lines.length >= 3 && formatted.startsWith('const __temp__')) {
            const content = lines
                .slice(1, -1)
                .map((line) => line.replace(/^\s{4}/, ''))
                .join('\n');
            return content;
        }
        return formatted;
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        // Don't try to wrap placeholder patterns - but be careful with spread operator
        if (hasPlaceholderPatterns(code)) {
            return false;
        }
        if (/(^|\n)\s*(import|export)\b/.test(code.trimStart())) {
            return false;
        }
        if (/^(const|let|var|class|function)\b/.test(trimmed)) {
            return false;
        }
        return (
            // Property: value pattern
            /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(trimmed) ||
            // String key
            /^["'][^"']+["']\s*:/.test(trimmed) ||
            // Computed property
            /^\[.*\]\s*:/.test(trimmed) ||
            // Spread operator (but not placeholder patterns)
            (trimmed.includes('...') && !trimmed.includes('{...}') && !trimmed.includes('[...]')) ||
            // Getter/setter
            /^get\s+\w+/.test(trimmed) ||
            /^set\s+\w+/.test(trimmed) ||
            // Method shorthand
            /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(trimmed) ||
            // Async method
            /^async\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(trimmed)
        );
    },
};

/**
 * Strategy for wrapping array elements
 */
const arrayWrapStrategy: WrapStrategy = {
    name: 'array',
    wrap: (code: string, _lang: string) => `const __temp__ = [\n${code}\n];`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            // Remove first and last lines (const __temp__ = [ and ];)
            // Remove the 4-space indentation
            let content = lines
                .slice(1, -1)
                .map((line) => line.replace(/^\s{4}/, ''))
                .join('\n');

            // Handle trailing commas that might be added by prettier for array elements
            // Remove trailing comma if it was added during formatting
            content = content.replace(/,\s*$/, '');

            // Also remove any trailing semicolon that may have been added
            content = content.replace(/;\s*$/, '');

            return content;
        }
        return formatted;
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        // Don't try to wrap placeholder patterns
        if (hasPlaceholderPatterns(code)) {
            return false;
        }
        // Handle explicit array literals
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            return true;
        }
        // Handle object literals that look like array entries (end with comma)
        if (trimmed.startsWith('{') && trimmed.endsWith('},')) {
            return true;
        }
        // Handle partial array elements that might be objects in array context
        // Look for patterns that suggest this is meant to be in an array
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            // Check if it contains array-like patterns or multiple similar objects
            const hasArrayLikeContent =
                /,\s*\{/.test(trimmed) || // Multiple objects separated by commas
                /\[\s*\{/.test(trimmed) || // Object inside array brackets
                /\}\s*,\s*\{/.test(trimmed); // Objects separated by commas
            if (hasArrayLikeContent) {
                return true;
            }
        }
        return false;
    },
};

// Note: We previously had a partialArrayElementStrategy here, but it was removed
// because the pattern { ... }, ]; is intentionally malformed documentation shorthand
// to indicate "this object is the last element of an array".
// We should not try to format these as they are pseudo-code, not valid JavaScript.

/**
 * Strategy for wrapping expressions
 */
const expressionWrapStrategy: WrapStrategy = {
    name: 'expression',
    wrap: (code: string, _lang: string) => `(\n${code}\n);`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        const lastLine = lines[lines.length - 1]?.trim();
        if (lines.length >= 2 && lines[0].startsWith('(') && lastLine?.endsWith(');')) {
            const bodyLines = lines.slice(1, -1);
            const indent = bodyLines.reduce<number>((acc, line) => {
                if (line.trim() === '') {
                    return acc;
                }
                const match = line.match(/^(\s*)/);
                const leading = match ? match[1].length : 0;
                if (acc === -1) {
                    return leading;
                }
                return Math.min(acc, leading);
            }, -1);
            const safeIndent = indent > 0 ? indent : 0;
            let dedented = bodyLines
                .map((line) => {
                    if (safeIndent === 0 || line.trim() === '') {
                        return line.trim() === '' ? '' : line;
                    }
                    return line.startsWith(' '.repeat(safeIndent)) ? line.slice(safeIndent) : line.replace(/^\s+/, '');
                })
                .join('\n');

            // Remove trailing semicolons that may have been added after closing braces
            dedented = dedented.replace(/(\});\s*$/, '$1');

            return dedented;
        }
        // Single line case - also remove semicolons after closing braces
        let result = formatted.replace(/^\(/, '').replace(/\);?$/, '');
        result = result.replace(/(\});\s*$/, '$1');
        return result;
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        // Don't try to wrap placeholder patterns
        if (hasPlaceholderPatterns(code)) {
            return false;
        }
        const hasModuleSyntax = /(^|\n)\s*(import|export)\b/.test(code.trimStart());
        if (hasModuleSyntax) {
            return false;
        }
        // Allow plain object literals that represent option blocks
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const looksLikeTypeAnnotation = /:\s*[^,{}()]+;/.test(trimmed);
            if (!looksLikeTypeAnnotation) {
                return true;
            }
            return false;
        }
        if (/^(const|let|var|class|function)\b/.test(trimmed)) {
            return false;
        }
        return (
            // Method chains
            trimmed.includes('.') ||
            // Function calls
            (trimmed.includes('(') && trimmed.includes(')')) ||
            // Array/object access
            trimmed.includes('[') ||
            // Template literals
            trimmed.includes('`')
        );
    },
};

/**
 * Strategy for wrapping JSX elements
 */
const reactComponentWrapStrategy: WrapStrategy = {
    name: 'reactComponent',
    wrap: (code: string) => {
        const indentedCode = code.replace(/^/gm, '    ');
        return `const __TempComponent = () => {\n${indentedCode}\n};`;
    },
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            const startIndex = lines.findIndex((line) => line.includes('const __TempComponent ='));
            const endIndex = lines.length - 1;

            if (startIndex !== -1 && lines[endIndex].trim() === '};') {
                const bodyLines = lines.slice(startIndex + 1, endIndex);

                const indent = bodyLines.reduce((acc, line) => {
                    if (line.trim() === '') {
                        return acc;
                    }
                    const match = line.match(/^(\s*)/);
                    const leading = match ? match[1].length : 0;
                    if (acc === -1) {
                        return leading;
                    }
                    return Math.min(acc, leading);
                }, -1);

                const safeIndent = indent > 0 ? indent : 0;
                const dedented = bodyLines
                    .map((line) => {
                        if (safeIndent === 0 || line.trim() === '') {
                            return line.trim() === '' ? '' : line;
                        }
                        return line.startsWith(' '.repeat(safeIndent))
                            ? line.slice(safeIndent)
                            : line.replace(/^\s+/, '');
                    })
                    .join('\n');

                return dedented;
            }
        }

        return formatted;
    },
    canHandle: (code: string, lang: string) => {
        const language = lang.toLowerCase();
        if (language !== 'jsx' && language !== 'tsx') {
            return false;
        }

        // Don't try to wrap placeholder patterns
        if (hasPlaceholderPatterns(code)) {
            return false;
        }

        const trimmed = code.trim();
        const hasJsx = /<\w/.test(code);
        if (!hasJsx) {
            return false;
        }

        const looksLikeAngular =
            /@Component\b/.test(code) ||
            /from\s+['"]@angular\//.test(code) ||
            /standalone\s*:\s*true/.test(code) ||
            /template\s*:`/.test(code);
        if (looksLikeAngular) {
            return false;
        }

        const looksLikeVue =
            /from\s+['"]vue['"]/.test(code) ||
            /createApp\s*\(/.test(code) ||
            /components\s*:\s*\{/.test(code) ||
            /setup\s*\(/.test(code);
        if (looksLikeVue) {
            return false;
        }

        const hasModuleSyntax = /(^|\n)\s*(import|export)\b/.test(code.trimStart());
        if (hasModuleSyntax) {
            return false;
        }

        const hasReactImports = /from\s+['"]react(?:-dom)?['"]/.test(code) || /import\s+React/.test(code);
        const hasReactDom = /\bcreateRoot\b/.test(code) || /\bReactDOM\b/.test(code);
        const startsWithReturn = trimmed.startsWith('return');
        const startsWithHookInitialisation = /^(const|let)\s+\[[^\]]+\]\s*=\s*use(State|Reducer|Transition)/.test(
            trimmed
        );

        return hasReactImports || hasReactDom || startsWithReturn || startsWithHookInitialisation;
    },
};

const jsxWrapStrategy: WrapStrategy = {
    name: 'jsx',
    wrap: (code: string, _lang: string) => `const __temp__ = (\n${code}\n);`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            // Check if it's wrapped with const __temp__ = ( ... );
            if (lines[0].includes('const __temp__ =') && lines[lines.length - 1] === ');') {
                // Remove first and last lines
                // Remove indentation
                const content = lines
                    .slice(1, -1)
                    .map((line) => line.replace(/^\s{4}/, ''))
                    .join('\n');
                return content;
            }
        }
        return formatted;
    },
    canHandle: (code: string, lang: string) => {
        const language = lang.toLowerCase();
        if (language !== 'jsx' && language !== 'tsx') {
            return false;
        }
        // Don't try to wrap placeholder patterns
        if (hasPlaceholderPatterns(code)) {
            return false;
        }
        const hasModuleSyntax = /(^|\n)\s*(import|export)\b/.test(code.trimStart());
        if (hasModuleSyntax) {
            return false;
        }

        const trimmed = code.trim();
        if (!trimmed.startsWith('<')) {
            return false;
        }
        // Look for JSX patterns
        return trimmed.includes('<') && trimmed.includes('>');
    },
};

/**
 * Strategy for wrapping TypeScript types
 */
const typeWrapStrategy: WrapStrategy = {
    name: 'type',
    wrap: (code: string, _lang: string) => `type __Temp__ = ${code};`,
    unwrap: (formatted: string) => {
        // Remove the type wrapper
        return formatted.replace(/^type __Temp__ = /, '').replace(/;$/, '');
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        if (trimmed === '') {
            return false;
        }

        // Don't try to wrap placeholder patterns
        if (hasPlaceholderPatterns(code)) {
            return false;
        }

        if (/^\s*type\s+[a-zA-Z_$]/.test(trimmed) || /^\s*interface\s+[a-zA-Z_$]/.test(trimmed)) {
            return true;
        }

        const looksLikeTypeLiteral = trimmed.startsWith('{') && /:\s*[^,{}()]+;/.test(trimmed);
        if (looksLikeTypeLiteral) {
            return true;
        }

        return false;
    },
};

/**
 * Strategy for wrapping interface properties
 */
const interfacePropertyWrapStrategy: WrapStrategy = {
    name: 'interfaceProperty',
    wrap: (code: string, _lang: string) => `interface __Temp__ {\n${code}\n}`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            // Remove interface wrapper
            // Remove indentation
            const content = lines
                .slice(1, -1)
                .map((line) => line.replace(/^\s{4}/, ''))
                .join('\n');
            return content;
        }
        return formatted;
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        if (!trimmed.endsWith(';')) {
            return false;
        }

        // Don't try to wrap placeholder patterns
        if (hasPlaceholderPatterns(code)) {
            return false;
        }

        // Look for interface property or method signature patterns
        // Must NOT have an opening brace after the colon (which would make it an object literal)
        return (
            // Property with type annotation (but not object literal)
            (/^(readonly\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\??\s*:/.test(trimmed) &&
                !/^\w+\s*:\s*\{/.test(trimmed) &&
                !trimmed.includes('=') &&
                !trimmed.includes('function') &&
                !trimmed.includes('=>')) ||
            // String key
            /^["'][^"']+["']\s*:/.test(trimmed) ||
            // Computed property
            /^\[.*\]\s*:/.test(trimmed) ||
            // Method signature
            /^(readonly\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\??\s*\(/.test(trimmed)
        );
    },
};

/**
 * Strategy for wrapping bare objects in documentation
 */
const bareObjectWrapStrategy: WrapStrategy = {
    name: 'bareObject',
    wrap: (code: string, _lang: string) => {
        return `const __temp__ = ${code};`;
    },
    unwrap: (formatted: string) => {
        // Remove the const __temp__ = wrapper and trailing semicolon
        return formatted.replace(/^const __temp__ = /, '').replace(/;[\s]*$/, '');
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        // Don't wrap placeholder patterns
        if (hasPlaceholderPatterns(code)) {
            return false;
        }
        // Handle bare objects that start with { and end with }
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            // Make sure it's not already a valid statement
            const hasDeclaration = /^(const|let|var|class|function)\b/.test(trimmed);
            const hasModuleSyntax = /(^|\n)\s*(import|export)\b/.test(code);
            return !hasDeclaration && !hasModuleSyntax;
        }
        return false;
    },
};

/**
 * Ordered list of strategies to try
 */
export const wrapStrategies: WrapStrategy[] = [
    bareObjectWrapStrategy,  // Try bare objects first
    reactComponentWrapStrategy,
    jsxWrapStrategy,
    typeWrapStrategy,
    interfacePropertyWrapStrategy,
    objectWrapStrategy,
    arrayWrapStrategy,
    expressionWrapStrategy,
    functionWrapStrategy,
];

/**
 * Try to wrap code with an appropriate strategy
 */
export function tryWrapCode(code: string, lang: string): { wrapped: string; strategy: WrapStrategy } | null {
    // Try each strategy in order
    for (const strategy of wrapStrategies) {
        if (strategy.canHandle(code, lang)) {
            return {
                wrapped: strategy.wrap(code, lang),
                strategy,
            };
        }
    }

    // If no specific strategy matches, return null to indicate
    // that the code should be formatted as-is
    return null;
}
