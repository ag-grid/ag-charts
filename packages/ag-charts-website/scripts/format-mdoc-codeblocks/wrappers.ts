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
        const trimmed = code.trim();
        // Check if this is a complete object literal that already has braces
        if (trimmed.startsWith('{') && (trimmed.endsWith('}') || trimmed.endsWith('};'))) {
            // It's already a complete object, just assign it
            // Mark whether it had a semicolon for unwrapping
            const hadSemicolon = trimmed.endsWith('};');
            return `// __HAD_SEMICOLON__:${hadSemicolon}\nconst __temp__ = ${code}`;
        }
        // Otherwise, it's object properties without braces, so wrap them
        const indentedCode = code.replace(/^/gm, '    ');
        return `const __temp__ = {\n    // __ORIGINAL_START__\n    ${indentedCode}\n    // __ORIGINAL_END__\n};`;
    },
    unwrap: (formatted: string) => {
        // Check if this was a complete object (no markers)
        if (!formatted.includes('// __ORIGINAL_START__')) {
            // Check if original had semicolon
            const hadSemicolon = formatted.includes('// __HAD_SEMICOLON__:true');
            // For complete objects, just remove the wrapper
            // The formatted code might have the comment on first line
            const lines = formatted.split('\n');
            const codeWithoutComment = lines.filter(line => !line.includes('// __HAD_SEMICOLON__')).join('\n');
            const match = codeWithoutComment.match(/^const __temp__ = (\{[\s\S]*?\});?$/);
            if (match) {
                let result = match[1];
                // Add semicolon back if original had it
                if (hadSemicolon && !result.endsWith('};')) {
                    result = result.replace(/\}$/, '};');
                }
                return result;
            }
        }

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

        // Check if it's a plain object literal
        if (trimmed.startsWith('{') && (trimmed.endsWith('}') || trimmed.endsWith('};'))) {
            // Make sure it's not a code block or type definition
            const looksLikeTypeAnnotation = /:\s*[^,{}()]+;/.test(trimmed);
            if (!looksLikeTypeAnnotation) {
                return true;
            }
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
        // Don't match plain object literals - let objectWrapStrategy handle them
        // This includes objects that end with };
        if (trimmed.startsWith('{') && (trimmed.endsWith('}') || trimmed.endsWith('};'))) {
            return false;
        }
        if (/^(const|let|var|class|function)\b/.test(trimmed)) {
            return false;
        }
        // Only match actual expressions, not objects with methods
        const startsWithExpression =
            // Method/property chain
            /^\w+\./.test(trimmed) ||
            // Function call (but not an object)
            (/^\w+\(/.test(trimmed) && !trimmed.startsWith('{')) ||
            // Array/object member access
            /^\w+\[/.test(trimmed) ||
            // Template literal at start
            /^`/.test(trimmed);

        return startsWithExpression;
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
 * Strategy for documentation shorthand - object properties ending with };
 * This pattern shows partial object configuration in documentation
 */
const docShorthandStrategy: WrapStrategy = {
    name: 'docShorthand',
    wrap: (code: string, _lang: string) => {
        // Remove the trailing }; and wrap as object properties
        const withoutClosing = code.trim().replace(/\};?\s*$/, '');
        const indentedCode = withoutClosing.replace(/^/gm, '    ');
        return `const __temp__ = {\n${indentedCode}\n};`;
    },
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3 && formatted.startsWith('const __temp__')) {
            // Remove first and last lines, unindent the content
            const content = lines
                .slice(1, -1)
                .map(line => line.replace(/^    /, ''))
                .join('\n')
                .trim();
            // Add back the closing };
            return content + '\n};';
        }
        return formatted;
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        // Match documentation shorthand: properties ending with };
        // but NOT starting with {
        if (!trimmed.startsWith('{') && trimmed.endsWith('};')) {
            // Check if it looks like object properties (has colons)
            return /^\s*\w+\s*:/.test(trimmed) || /^\s*["'][^"']+["']\s*:/.test(trimmed);
        }
        return false;
    },
};

/**
 * Strategy for comment + partial object pattern
 */
const commentPlusObjectStrategy: WrapStrategy = {
    name: 'commentPlusObject',
    wrap: (code: string, _lang: string) => {
        const lines = code.split('\n');
        const commentLines: string[] = [];
        const codeLines: string[] = [];

        for (const line of lines) {
            if (line.trim().startsWith('//')) {
                commentLines.push(line);
            } else {
                codeLines.push(line);
            }
        }

        const codeContent = codeLines.join('\n').trim();
        const comments = commentLines.join('\n');

        // Check if it ends with }; indicating it's the end of a larger object
        if (codeContent.endsWith('};')) {
            // Remove the trailing };
            const withoutClosing = codeContent.slice(0, -2).trim();
            // If it still ends with }, it's a nested object that's part of a larger config
            if (withoutClosing.endsWith('},')) {
                // Wrap as object with nested property
                const wrappedCode = `const __temp__ = {\n    ${withoutClosing}\n};`;
                return comments + (comments ? '\n' : '') + wrappedCode;
            }
        }

        // Check if it's a partial property
        if (/^\w+\s*:/.test(codeContent) && !codeContent.startsWith('{')) {
            // Wrap as object with property - but preserve the trailing };
            const needsClosing = codeContent.endsWith('};');
            const cleanCode = needsClosing ? codeContent.slice(0, -2).trim() : codeContent;
            return comments + (comments ? '\n' : '') + `const __temp__ = {\n    ${cleanCode}\n};`;
        }
        return code; // Don't handle if not matching pattern
    },
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        const commentLines: string[] = [];
        let startIndex = 0;

        // Extract comments
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('//')) {
                commentLines.push(lines[i]);
            } else if (lines[i].includes('const __temp__')) {
                startIndex = i + 1;
                break;
            }
        }

        // Extract object content (between { and })
        const objectLines = lines.slice(startIndex, -1);
        let content = objectLines.map((line) => line.replace(/^ {4}/, '')).join('\n');

        // Check original code to see if it ended with };
        const originalLines = formatted.split('\n').filter((l) => !l.includes('__temp__'));
        const hasTrailingBrace = originalLines.some((l) => l.trim().endsWith('};'));

        // If original had }; add it back
        if (hasTrailingBrace || content.endsWith('},')) {
            if (content.endsWith(',')) {
                content = content + '\n};';
            } else if (content.endsWith('}')) {
                content = content + ';';
            }
        }

        if (commentLines.length > 0) {
            return commentLines.join('\n') + '\n' + content;
        }
        return content;
    },
    canHandle: (code: string, _lang: string) => {
        const trimmed = code.trim();
        // Has comment followed by property notation or object ending
        return /^\/\//.test(trimmed) && (/\n\s*\w+\s*:/.test(code) || code.includes('};'));
    },
};


/**
 * Strategy for React hooks outside components
 */
const standaloneReactHooksStrategy: WrapStrategy = {
    name: 'standaloneReactHooks',
    wrap: (code: string, lang: string) => {
        const isTypeScript = lang.toLowerCase().includes('ts');
        const componentType = isTypeScript ? ': React.FC' : '';
        return `const Component${componentType} = () => {\n    ${code.replace(/\n/g, '\n    ')}\n};`;
    },
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        // Find the component declaration line
        const startIdx = lines.findIndex((line) => line.includes('const Component'));
        const endIdx = lines.length - 1;

        if (startIdx !== -1 && lines[endIdx].trim() === '};') {
            // Extract body and remove indentation
            const bodyLines = lines.slice(startIdx + 1, endIdx);
            return bodyLines.map((line) => line.replace(/^ {4}/, '')).join('\n');
        }
        return formatted;
    },
    canHandle: (code: string, lang: string) => {
        const language = lang.toLowerCase();
        if (language !== 'jsx' && language !== 'tsx') {
            return false;
        }
        const trimmed = code.trim();

        // Check for React hooks pattern
        const hasUseState = /^(const|let)\s+\[.*\]\s*=\s*useState/.test(trimmed);
        const hasUseEffect = /^useEffect/.test(trimmed);
        const hasReactHook = /^use[A-Z]\w*\(/.test(trimmed);

        // If it has both hooks AND a return statement with JSX, it's complete component content
        // that should be handled by reactComponentWrapStrategy instead
        const hasReturnJsx = /return\s*[(<]/.test(code);
        if ((hasUseState || hasUseEffect || hasReactHook) && hasReturnJsx) {
            return false; // Let reactComponentWrapStrategy handle this
        }

        // Check for standalone return statements
        const startsWithReturn = /^return\s*[(<]/.test(trimmed);

        // Make sure it's not already in a component or function
        const hasComponentDeclaration = /function\s+\w+|const\s+\w+\s*=.*=>/.test(trimmed);

        return (hasUseState || hasUseEffect || hasReactHook || startsWithReturn) && !hasComponentDeclaration;
    },
};

/**
 * Ordered list of strategies to try
 */
export const wrapStrategies: WrapStrategy[] = [
    docShorthandStrategy, // Handle documentation shorthand patterns first
    commentPlusObjectStrategy, // Handle comment + object patterns
    standaloneReactHooksStrategy, // Handle React hooks outside components
    reactComponentWrapStrategy,
    jsxWrapStrategy,
    typeWrapStrategy,
    interfacePropertyWrapStrategy,
    objectWrapStrategy, // Handles both complete objects and object properties
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
