/**
 * Wrapper strategies for formatting partial code snippets.
 * Each strategy wraps code to make it valid JS/TS for Prettier, then unwraps after formatting.
 *
 * Usage: Add wrapper="strategyName" metadata to code blocks that need wrapping.
 * Example: ```js wrapper="object"
 */

export interface WrapStrategy {
    name: string;
    wrap: (code: string, lang: string) => string;
    unwrap: (formatted: string) => string;
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
        // Check if this is a complete object literal that already has braces
        if (trimmed.startsWith('{') && (trimmed.endsWith('}') || trimmed.endsWith('};'))) {
            // It's already a complete object, just assign it
            const hadSemicolon = trimmed.endsWith('};');
            return `// __HAD_SEMICOLON__:${hadSemicolon}\nconst __temp__ = ${code}`;
        }
        // Otherwise, it's object properties without braces, so wrap them
        return `const __temp__ = {\n${code}\n};`;
    },
    unwrap: (formatted: string) => {
        // Handle complete objects (with marker comment)
        const hadSemicolonMatch = formatted.match(/\/\/ __HAD_SEMICOLON__:(true|false)\n/);
        if (hadSemicolonMatch) {
            const hadSemicolon = hadSemicolonMatch[1] === 'true';
            formatted = formatted.replace(/\/\/ __HAD_SEMICOLON__:(true|false)\n/, '');

            const match = formatted.match(/^const __temp__ = ([\s\S]+)$/);
            if (match) {
                let obj = match[1].trim();
                // Remove the trailing semicolon added by prettier
                if (obj.endsWith(';')) {
                    obj = obj.slice(0, -1);
                }
                // Add back semicolon if original had it
                if (hadSemicolon && !obj.endsWith(';')) {
                    obj += ';';
                }
                return obj;
            }
        }

        // Handle object properties (without braces)
        const lines = formatted.split('\n');
        // Remove the wrapper lines
        const filtered = lines.filter((line, idx) => {
            if (idx === 0 && line.trim() === 'const __temp__ = {') return false;
            if (idx === lines.length - 1 && line.trim() === '};') return false;
            return true;
        });
        return filtered.join('\n');
    },
};

/**
 * For standalone expressions that need to be wrapped in parentheses.
 * Use when: Code block contains a single expression (not an object or array literal).
 *
 * Examples:
 * - `Math.round(value * 100) / 100`
 * - `condition ? true : false`
 * - `document.getElementById('myChart')`
 */
const expressionStrategy: WrapStrategy = {
    name: 'expression',
    wrap: (code: string) => `(\n${code}\n);`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        // Remove the wrapper parentheses
        const filtered = lines.filter((line, idx) => {
            if (idx === 0 && line.trim() === '(') return false;
            if (idx === lines.length - 1 && line.trim() === ');') return false;
            return true;
        });
        return filtered.join('\n');
    },
};

/**
 * For JSX elements that need a React component wrapper.
 * Use when: Code block contains JSX elements without a component function.
 *
 * Examples:
 * - `<div>Hello</div>`
 * - `<AgCharts options={options} />`
 * - Multiple JSX elements that should be rendered together
 */
const reactComponentStrategy: WrapStrategy = {
    name: 'reactComponent',
    wrap: (code: string) => `function Component() {\n    return (\n${code}\n    );\n}`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        // Find the return statement content
        const startIdx = lines.findIndex((line) => line.includes('return ('));
        const endIdx = lines.findLastIndex((line) => line.trim() === ');');

        if (startIdx !== -1 && endIdx !== -1) {
            // Get lines between return ( and );
            const content = lines.slice(startIdx + 1, endIdx);
            // Remove the indentation added by the wrapper (4 spaces)
            return content.map((line) => line.replace(/^    /, '')).join('\n');
        }
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

        // Try to find our added return null first
        const returnNullIdx = lines.findIndex((line) => line.trim() === 'return null;');

        // If we don't find return null, look for the closing brace
        const endIdx = returnNullIdx !== -1 ? returnNullIdx : lines.length - 1;

        if (startIdx !== -1) {
            // Get lines between function declaration and end
            const content = lines.slice(startIdx + 1, endIdx);
            // Remove empty lines at the end
            while (content.length > 0 && content[content.length - 1].trim() === '') {
                content.pop();
            }
            return content.join('\n');
        }
        return formatted;
    },
};

/**
 * For import statements that need module context.
 * Use when: Code block contains only import statements.
 *
 * Examples:
 * - `import { AgCharts } from 'ag-charts-community';`
 * - Multiple import statements
 * - `import React from 'react';`
 */
const importsStrategy: WrapStrategy = {
    name: 'imports',
    wrap: (code: string) => `${code}\n\n// Placeholder to make valid module\nexport {};`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        // Remove the placeholder export
        const exportIdx = lines.findIndex((line) => line.includes('// Placeholder to make valid module'));
        if (exportIdx !== -1) {
            // Remove from placeholder comment onwards
            return lines.slice(0, exportIdx).join('\n').trimEnd();
        }
        return formatted;
    },
};

/**
 * For documentation shorthand patterns that end with }; or similar.
 * Use when: Code block shows partial configuration meant for documentation.
 *
 * Examples:
 * - `theme: myTheme // ...other options` followed by `};` (object property ending with };)
 * - `fill: '#5C6BC0', cornerRadius: 3 };` (multiple properties ending with };)
 */
const docShorthandStrategy: WrapStrategy = {
    name: 'docShorthand',
    wrap: (code: string) => {
        const trimmed = code.trim();
        // Remove the trailing }; and wrap as object
        const withoutClosing = trimmed.replace(/\};?\s*$/, '');
        return `const __temp__ = {\n${withoutClosing}\n};`;
    },
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3 && formatted.startsWith('const __temp__')) {
            // Remove first and last lines, unindent the content
            const content = lines
                .slice(1, -1)
                .map((line) => line.replace(/^    /, ''))
                .join('\n')
                .trim();
            // Add back the closing };
            return content + '\n};';
        }
        return formatted;
    },
};

/**
 * Map of all available wrapper strategies.
 * Use the strategy name in code block metadata: ```js wrapper="object"
 */
export const wrapperStrategies: Record<string, WrapStrategy> = {
    object: objectStrategy,
    expression: expressionStrategy,
    reactComponent: reactComponentStrategy,
    reactHooks: reactHooksStrategy,
    imports: importsStrategy,
    docShorthand: docShorthandStrategy,
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
