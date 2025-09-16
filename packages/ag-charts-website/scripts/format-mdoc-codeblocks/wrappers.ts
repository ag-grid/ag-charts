export interface WrapStrategy {
    name: string;
    wrap: (code: string) => string;
    unwrap: (formatted: string) => string;
    canHandle: (code: string) => boolean;
}

/**
 * Strategy for wrapping function body code
 */
const functionWrapStrategy: WrapStrategy = {
    name: 'function',
    wrap: (code: string) => `function __temp__() {\n${code}\n}`,
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
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return (
            trimmed.includes('return') ||
            trimmed.includes('if') ||
            trimmed.includes('for') ||
            trimmed.includes('while') ||
            trimmed.includes('const ') ||
            trimmed.includes('let ') ||
            trimmed.includes('var ') ||
            trimmed.includes('function') ||
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
    wrap: (code: string) => {
        // Always wrap as an object property - this is the most reliable approach
        return `const __temp__ = {\n    // __ORIGINAL_START__\n    ${code.split('\n').join('\n    ')}\n    // __ORIGINAL_END__\n};`;
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
                content = nonEmptyLines.map(line => line.replace(/^\s{4}/, '')).join('\n').trim();

                // Prettier adds a comma after the object property when it's wrapped
                // We need to remove it if it's there
                if (content.endsWith(',')) {
                    content = content.slice(0, -1).trimEnd();
                }

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
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return (
            // Property: value pattern
            /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(trimmed) ||
            // String key
            /^["'][^"']+["']\s*:/.test(trimmed) ||
            // Computed property
            /^\[.*\]\s*:/.test(trimmed) ||
            // Spread operator
            trimmed.includes('...') ||
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
    wrap: (code: string) => `const __temp__ = [\n${code}\n];`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            // Remove first and last lines
            // Remove the 4-space indentation
            const content = lines
                .slice(1, -1)
                .map((line) => line.replace(/^\s{4}/, ''))
                .join('\n');
            return content;
        }
        return formatted;
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
        // Look for patterns that indicate array elements
        return (
            // Object literal followed by comma
            (trimmed.startsWith('{') && trimmed.includes('},')) ||
            // Multiple values separated by commas
            (trimmed.split(',').length > 1 && !trimmed.includes(':'))
        );
    },
};

/**
 * Strategy for wrapping expressions
 */
const expressionWrapStrategy: WrapStrategy = {
    name: 'expression',
    wrap: (code: string) => `(\n${code}\n);`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3 && lines[0] === '(' && lines[lines.length - 1] === ');') {
            // Remove parentheses wrapper
            // Remove indentation if present
            const content = lines
                .slice(1, -1)
                .map((line) => line.replace(/^\s{4}/, ''))
                .join('\n');
            return content;
        }
        // Single line case
        return formatted.replace(/^\(/, '').replace(/\);?$/, '');
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
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
const jsxWrapStrategy: WrapStrategy = {
    name: 'jsx',
    wrap: (code: string) => `const __temp__ = (\n${code}\n);`,
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
    canHandle: (code: string) => {
        const trimmed = code.trim();
        // Look for JSX patterns
        return trimmed.includes('<') && trimmed.includes('>');
    },
};

/**
 * Strategy for wrapping TypeScript types
 */
const typeWrapStrategy: WrapStrategy = {
    name: 'type',
    wrap: (code: string) => `type __Temp__ = ${code};`,
    unwrap: (formatted: string) => {
        // Remove the type wrapper
        return formatted.replace(/^type __Temp__ = /, '').replace(/;$/, '');
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return (
            // Union types
            trimmed.includes('|') ||
            // Intersection types
            trimmed.includes('&') ||
            // Generic types
            (trimmed.includes('<') && trimmed.includes('>') && !trimmed.includes('</')) ||
            // Conditional types
            trimmed.includes('?:') ||
            // Object type literal
            (/^{\s*\w+\s*:/.test(trimmed) && !trimmed.includes('('))
        );
    },
};

/**
 * Strategy for wrapping interface properties
 */
const interfacePropertyWrapStrategy: WrapStrategy = {
    name: 'interfaceProperty',
    wrap: (code: string) => `interface __Temp__ {\n${code}\n}`,
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
    canHandle: (code: string) => {
        const trimmed = code.trim();
        // Look for interface property patterns
        // Must NOT have an opening brace after the colon (which would make it an object literal)
        return (
            // Property with type annotation (but not object literal)
            /^\w+\??\s*:/.test(trimmed) &&
            !trimmed.includes('=>') &&
            !trimmed.includes('function') &&
            !/^\w+\s*:\s*\{/.test(trimmed)  // Exclude object literals
        );
    },
};

/**
 * Ordered list of strategies to try
 */
export const wrapStrategies: WrapStrategy[] = [
    jsxWrapStrategy,
    interfacePropertyWrapStrategy,
    typeWrapStrategy,
    objectWrapStrategy,
    arrayWrapStrategy,
    functionWrapStrategy,
    expressionWrapStrategy,
];

/**
 * Try to wrap code with an appropriate strategy
 */
export function tryWrapCode(code: string): { wrapped: string; strategy: WrapStrategy } | null {
    // Try each strategy in order
    for (const strategy of wrapStrategies) {
        if (strategy.canHandle(code)) {
            return {
                wrapped: strategy.wrap(code),
                strategy,
            };
        }
    }

    // If no specific strategy matches, return null to indicate
    // that the code should be formatted as-is
    return null;
}
