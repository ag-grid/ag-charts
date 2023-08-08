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
    const propertiesToRemove = ['title', 'footnote', 'legend', 'tick', 'padding', 'line', 'gridStyle'];
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
    optionsExpression.get(0).node.properties.push(legendPropertyNode);

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

            // Add `label.enabled = false`
            const label = propertiesNode.properties.find((prop) => prop.key.name === 'label');
            if (label) {
                propertiesNode.properties = filterPropertyKeys({
                    removePropertyKeys: ['label'],
                    properties: propertiesNode.properties,
                });
            }
            propertiesNode.properties.push(
                j.property(
                    'init',
                    j.identifier('label'),
                    j.objectExpression([j.property('init', j.identifier('enabled'), j.literal(false))])
                )
            );

            // Hide axis ticks and make the chart lines thicker
            propertiesNode.properties.push(
                j.property(
                    'init',
                    j.identifier('tick'),
                    j.objectExpression([
                        j.property('init', j.identifier('width'), j.literal(2)),
                        j.property('init', j.identifier('color'), j.literal('transparent')),
                    ])
                )
            );

            // Hide axis lines
            propertiesNode.properties.push(
                j.property(
                    'init',
                    j.identifier('line'),
                    j.objectExpression([j.property('init', j.identifier('color'), j.literal('transparent'))])
                )
            );

            // Make grid lines more prominent
            propertiesNode.properties.push(
                j.property(
                    'init',
                    j.identifier('gridStyle'),
                    j.arrayExpression([
                        j.objectExpression([
                            j.property('init', j.identifier('stroke'), j.literal('#C3C3C3')),
                            j.property(
                                'init',
                                j.identifier('lineDash'),
                                j.arrayExpression([j.literal(4), j.literal(4)])
                            ),
                        ]),
                    ])
                )
            );
        });

    // Remove any padding
    const paddingPropertyNode = j.property(
        'init',
        j.identifier('padding'),
        j.objectExpression([
            j.property('init', j.identifier('top'), j.literal(0)),
            j.property('init', j.identifier('right'), j.literal(0)),
            j.property('init', j.identifier('bottom'), j.literal(0)),
            j.property('init', j.identifier('left'), j.literal(0)),
        ])
    );
    optionsExpression.get(0).node.properties.push(paddingPropertyNode);

    const code = root.toSource();
    const options = parseExampleOptions('options', code, dataFile);

    return { code: root.toSource(), options };
}

export function transformPlainEntryFile(entryFile: string, dataFile?: string): { code: string; options: {} } {
    return transformer(entryFile, dataFile);
}
