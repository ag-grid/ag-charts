// -*- Mode: js -*-
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const HANDLER_ATTRIBUTE = /\son(?:click|change|input|dragover|dragstart|drop)\s*=\s*("|')(.*?)\1/gis;
const HANDLER_NAME = /^(\w+)\(/;
const COMPONENT_VARIABLES = ['options', 'chart'];

const handlerCache = new Map();

function readHandlers(dir) {
    if (handlerCache.has(dir)) return handlerCache.get(dir);
    const htmlPath = path.join(dir, 'index.html');
    const handlers = new Set();
    if (existsSync(htmlPath)) {
        const html = readFileSync(htmlPath, 'utf-8')
            .replaceAll(/<style[\s\S]*?<\/style>/gi, '')
            .replaceAll(/<!--[\s\S]*?-->/g, '');
        for (const [, , value] of html.matchAll(HANDLER_ATTRIBUTE)) {
            const name = HANDLER_NAME.exec(value)?.[1];
            if (name) handlers.add(name);
        }
    }
    handlerCache.set(dir, handlers);
    return handlers;
}

function isInScopeComment(comment) {
    if (comment.type !== 'Block' || !comment.value.startsWith('*')) return false;
    const description = comment.value
        .split('\n')
        .filter((line) => !/^\s*\*?\s*@/.test(line))
        .join('\n');
    return description.includes('inScope');
}

function isFunctionExpression(node) {
    return node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression';
}

function isInTypePosition(node) {
    for (let parent = node.parent; parent; parent = parent.parent) {
        if (parent.type === 'TSTypeQuery' || parent.type === 'TSTypeAnnotation') return true;
    }
    return false;
}

function containsGetElementById(sourceCode, node) {
    return /\bdocument\s*\.\s*getElementById\b/.test(sourceCode.getText(node));
}

/**
 * The example generator moves only `/** inScope *\/` functions and index.html handlers into the React/Angular/Vue
 * component beside `options` and `chart`; everything else stays at module scope, where those names do not exist.
 * Multi-chart examples get no inScope methods on React and Angular, so marking does not make them framework-safe.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Require top-level example helpers that use component-scoped names to be marked `/** inScope */`',
        },
        messages: {
            helper: "'{{name}}' stays at module scope in React/Angular/Vue examples but reads {{refs}}, defined only inside the generated component. Mark it `/** inScope */` (function declarations only) or move it into component scope. If the example is pinned to vanilla, disable this rule for the line with a reason.",
            initialiser:
                "'{{name}}' is initialised at module scope in React/Angular/Vue examples but its initialiser uses {{refs}}, defined only inside the generated component. Create it lazily from an `/** inScope */` function instead. If the example is pinned to vanilla, disable this rule for the line with a reason.",
        },
        schema: [
            {
                type: 'object',
                properties: { handlers: { type: 'array', items: { type: 'string' } } },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            'Program:exit'(program) {
                const statements = program.body.map((stmt) =>
                    stmt.type === 'ExportNamedDeclaration' && stmt.declaration
                        ? { node: stmt.declaration, wrapper: stmt }
                        : { node: stmt, wrapper: stmt }
                );

                const functionDeclarations = new Map();
                const inScope = new Set();
                for (const { node, wrapper } of statements) {
                    if (node.type !== 'FunctionDeclaration' || !node.id) continue;
                    functionDeclarations.set(node.id.name, node);
                    if (sourceCode.getCommentsBefore(wrapper).some(isInScopeComment)) {
                        inScope.add(node.id.name);
                    }
                }

                const configuredHandlers = context.options[0]?.handlers;
                const handlerNames =
                    configuredHandlers ?? readHandlers(path.dirname(context.physicalFilename ?? context.filename));
                const handlers = new Set([...handlerNames].filter((name) => functionDeclarations.has(name)));

                const globalScope = sourceCode.scopeManager.globalScope;
                const moduleScope = globalScope.childScopes.find((s) => s.type === 'module') ?? globalScope;
                const targetNames = new Set([...COMPONENT_VARIABLES, ...inScope, ...handlers]);
                const targets = moduleScope.variables.filter((v) => targetNames.has(v.name));

                const topLevelOf = new Map(statements.map(({ node, wrapper }) => [wrapper, node]));
                const findTopLevel = (node) => {
                    let current = node;
                    while (current.parent && current.parent !== program) current = current.parent;
                    return topLevelOf.get(current);
                };
                const findDeclarator = (declaration, node) => {
                    let current = node;
                    while (current.parent && current.parent !== declaration) current = current.parent;
                    return current.type === 'VariableDeclarator' ? current : undefined;
                };

                const findings = new Map();
                const record = (reportNode, messageId, name, ref) => {
                    const finding = findings.get(reportNode) ?? { messageId, name, refs: new Set() };
                    finding.refs.add(ref);
                    findings.set(reportNode, finding);
                };

                for (const variable of targets) {
                    const isComponentVariable = COMPONENT_VARIABLES.includes(variable.name);
                    for (const reference of variable.references) {
                        if (reference.init || reference.isTypeReference) continue;
                        if (isInTypePosition(reference.identifier)) continue;

                        const statement = findTopLevel(reference.identifier);
                        if (!statement) continue;

                        if (statement.type === 'FunctionDeclaration') {
                            const name = statement.id?.name;
                            if (!name || inScope.has(name) || handlers.has(name)) continue;
                            record(statement.id, 'helper', name, variable.name);
                            continue;
                        }

                        if (statement.type !== 'VariableDeclaration') continue;
                        const declarator = findDeclarator(statement, reference.identifier);
                        if (!declarator?.init || declarator.id.type !== 'Identifier') continue;
                        const name = declarator.id.name;
                        if (COMPONENT_VARIABLES.includes(name)) continue;

                        if (isFunctionExpression(declarator.init)) {
                            record(declarator.id, 'helper', name, variable.name);
                        } else if (!isComponentVariable && !containsGetElementById(sourceCode, declarator.init)) {
                            record(declarator.id, 'initialiser', name, variable.name);
                        }
                    }
                }

                for (const [node, { messageId, name, refs }] of findings) {
                    context.report({
                        node,
                        messageId,
                        data: {
                            name,
                            refs: [...refs]
                                .sort()
                                .map((ref) => `'${ref}'`)
                                .join(', '),
                        },
                    });
                }
            },
        };
    },
};
