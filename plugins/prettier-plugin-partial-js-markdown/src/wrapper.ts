export interface WrapStrategy {
    name: string;
    wrap: (code: string) => string;
    unwrap: (formatted: string) => string;
    canHandle: (code: string) => boolean;
}

const functionWrapStrategy: WrapStrategy = {
    name: 'function',
    wrap: (code: string) => `function __temp__() {\n${code}\n}`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            return lines.slice(1, -1).join('\n').replace(/^    /gm, '');
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
            trimmed.includes('=>')
        );
    },
};

const objectWrapStrategy: WrapStrategy = {
    name: 'object',
    wrap: (code: string) => `const __temp__ = {\n${code}\n};`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            const content = lines.slice(1, -1).join('\n');
            return content.replace(/^    /gm, '');
        }
        return formatted;
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return (
            /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(trimmed) ||
            /^["'][^"']+["']\s*:/.test(trimmed) ||
            /^\[.*\]\s*:/.test(trimmed) ||
            trimmed.includes('...') ||
            /^get\s+\w+/.test(trimmed) ||
            /^set\s+\w+/.test(trimmed)
        );
    },
};

const arrayWrapStrategy: WrapStrategy = {
    name: 'array',
    wrap: (code: string) => `const __temp__ = [\n${code}\n];`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            const content = lines.slice(1, -1).join('\n');
            return content.replace(/^    /gm, '');
        }
        return formatted;
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return trimmed.startsWith('{') && trimmed.endsWith('},');
    },
};

const expressionWrapStrategy: WrapStrategy = {
    name: 'expression',
    wrap: (code: string) => `(\n${code}\n);`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            const content = lines.slice(1, -1).join('\n');
            return content.replace(/^    /gm, '');
        }
        return formatted.replace(/^\(/, '').replace(/\);?$/, '');
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return trimmed.includes('.') || trimmed.includes('(') || trimmed.includes('[') || trimmed.includes('{');
    },
};

const jsxWrapStrategy: WrapStrategy = {
    name: 'jsx',
    wrap: (code: string) => `const __temp__ = (\n${code}\n);`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            const content = lines.slice(1, -1).join('\n');
            return content.replace(/^    /gm, '');
        }
        return formatted;
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return trimmed.includes('<') && trimmed.includes('>');
    },
};

const typeWrapStrategy: WrapStrategy = {
    name: 'type',
    wrap: (code: string) => `type __Temp__ = ${code};`,
    unwrap: (formatted: string) => {
        return formatted.replace(/^type __Temp__ = /, '').replace(/;$/, '');
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return (
            trimmed.includes('|') ||
            trimmed.includes('&') ||
            trimmed.includes('<') ||
            trimmed.includes('?:') ||
            /^{\s*\w+\s*:/.test(trimmed)
        );
    },
};

const interfacePropertyWrapStrategy: WrapStrategy = {
    name: 'interfaceProperty',
    wrap: (code: string) => `interface __Temp__ {\n${code}\n}`,
    unwrap: (formatted: string) => {
        const lines = formatted.split('\n');
        if (lines.length >= 3) {
            const content = lines.slice(1, -1).join('\n');
            return content.replace(/^    /gm, '');
        }
        return formatted;
    },
    canHandle: (code: string) => {
        const trimmed = code.trim();
        return /^\w+\??\s*:/.test(trimmed) && !trimmed.includes('=>');
    },
};

export const wrapStrategies: WrapStrategy[] = [
    jsxWrapStrategy,
    interfacePropertyWrapStrategy,
    typeWrapStrategy,
    objectWrapStrategy,
    arrayWrapStrategy,
    functionWrapStrategy,
    expressionWrapStrategy,
];

export function tryWrapCode(code: string): { wrapped: string; strategy: WrapStrategy } | null {
    for (const strategy of wrapStrategies) {
        if (strategy.canHandle(code)) {
            return {
                wrapped: strategy.wrap(code),
                strategy,
            };
        }
    }

    return {
        wrapped: code,
        strategy: {
            name: 'none',
            wrap: (c) => c,
            unwrap: (c) => c,
            canHandle: () => true,
        },
    };
}
