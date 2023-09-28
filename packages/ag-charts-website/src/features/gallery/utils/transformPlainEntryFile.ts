import j from 'jscodeshift';
import { filterPropertyKeys } from '@utils/jsCodeShiftUtils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { parseExampleOptions } from '../../../../../ag-charts-community/src/chart/test/load-example';

/**
 * JS Code Shift transformer to generate plain entry file
 */

function transformer(sourceFile: string, dataFile?: string) {
    const root = j(sourceFile);

    const optionsExpression = root
        .find(j.VariableDeclarator, {
            id: {
                type: 'Identifier',
                name: 'options',
            },
        })
        .find(j.ObjectExpression);

    // Find and remove properties in the 'options' object
    const propertiesToRemove = ['subtitle', 'footnote', 'legend'];
    optionsExpression.forEach((path) => {
        path.node.properties = filterPropertyKeys({
            removePropertyKeys: propertiesToRemove,
            properties: path.node.properties,
        });
    });

    // Add disabled legend
    const legendPropertyNode = j.property(
        'init',
        j.identifier('legend'),
        j.objectExpression([j.property('init', j.identifier('enabled'), j.literal(false))])
    );

    const optionsNode = optionsExpression.get(0).node;
    optionsNode.properties = optionsNode.properties.filter((property: any) => property.key?.name !== 'padding');
    const optionsExpressionProperties = optionsNode.properties;
    optionsExpressionProperties.push(legendPropertyNode);

    // Axes
    optionsExpression
        .find(j.Property, {
            key: {
                name: 'axes',
            },
        })
        .find(j.ObjectExpression)
        .forEach((path) => {
            const propertiesNode = path.node;

            // Remove axis title
            const title = propertiesNode.properties.find((prop) => prop.key.name === 'title');
            if (title) {
                propertiesNode.properties = filterPropertyKeys({
                    removePropertyKeys: ['title'],
                    properties: propertiesNode.properties,
                });
            }
            propertiesNode.properties.push(
                j.property(
                    'init',
                    j.identifier('title'),
                    j.objectExpression([j.property('init', j.identifier('enabled'), j.literal(false))])
                )
            );
        });

    // Padding
    const paddingPropertyNode = j.property(
        'init',
        j.identifier('padding'),
        j.objectExpression([
            j.property('init', j.identifier('top'), j.literal(10)),
            j.property('init', j.identifier('right'), j.literal(20)),
            j.property('init', j.identifier('bottom'), j.literal(10)),
            j.property('init', j.identifier('left'), j.literal(20)),
        ])
    );
    optionsExpressionProperties.push(paddingPropertyNode);

    const code = root.toSource();
    const options = parseExampleOptions('options', code, dataFile);

    return { code, options };
}

export function transformPlainEntryFile(entryFile: string, dataFile?: string): { code: string; options: {} } {
    return transformer(entryFile, dataFile);
}
