import j from 'jscodeshift';

import * as agCharts from 'ag-charts-community';
import { parseExampleOptions } from 'ag-charts-test';

import { filterPropertyKeys } from './jsCodeShiftUtils';

/**
 * JS Code Shift transformer to generate plain entry file
 */

function generateOptions(
    root: j.Collection<any>,
    variableDeclarator: j.Collection<j.VariableDeclarator>,
    dataFile?: string
) {
    const optionsExpression = variableDeclarator.find(j.ObjectExpression);

    optionsExpression.forEach((path) => {
        path.node.properties = filterPropertyKeys({
            removePropertyKeys: ['container'],
            properties: path.node.properties,
        });
    });

    const code = root.toSource();

    const node = variableDeclarator.getAST()[0].node;
    if (node.id.type !== 'Identifier') {
        throw new Error('Invalid options specifier');
    }
    const options: agCharts.AgChartOptions = parseExampleOptions(node.id.name, code, dataFile, { agCharts });

    return { code, options };
}

function transformer(sourceFile: string, dataFile?: string) {
    const root = j(sourceFile);
    let code = root.toSource();

    const optionsById = new Map<string, agCharts.AgChartOptions>();
    root.findVariableDeclarators().forEach((variableDeclaratorPath) => {
        const variableDeclarator = j(variableDeclaratorPath);
        const containerPropertyPath = variableDeclarator
            .find(j.ObjectExpression)
            .find(j.Property, { key: { type: 'Identifier', name: 'container' } })
            .find(
                j.CallExpression,
                ({ callee }) =>
                    callee.type === 'MemberExpression' &&
                    callee.object.type === 'Identifier' &&
                    callee.object.name === 'document' &&
                    callee.property.type === 'Identifier' &&
                    callee.property.name === 'getElementById'
            )
            .find(j.Literal)
            .paths()[0];

        if (containerPropertyPath != null) {
            const { code: _code, options } = generateOptions(root, variableDeclarator, dataFile);
            optionsById.set(containerPropertyPath.node.value as any, options);
            code = _code;
        }
    });

    return { code, optionsById };
}

export function transformPlainEntryFile(
    entryFile: string,
    dataFile?: string
): { code: string; optionsById: Map<string, agCharts.AgChartOptions> } {
    return transformer(entryFile, dataFile);
}
