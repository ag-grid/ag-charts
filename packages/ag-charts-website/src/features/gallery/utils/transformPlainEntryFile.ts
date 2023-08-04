import j from 'jscodeshift';
import { filterPropertyKeys } from '../../../utils/jsCodeShiftUtils';

/**
 * JS Code Shift transformer to generate plain entry file
 */
function transformer(sourceFile: string) {
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
    const propertiesToRemove = ['title', 'footnote', 'legend', 'tick', 'padding'];
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

            // Add `tick.enabled = false`
            const hasTick = propertiesNode.properties.some((prop) => prop.key.name === 'tick');
            if (!hasTick) {
                propertiesNode.properties.push(
                    j.property(
                        'init',
                        j.identifier('tick'),
                        j.objectExpression([j.property('init', j.identifier('enabled'), j.literal(false))])
                    )
                );
            }
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

    return root.toSource();
}

export function transformPlainEntryFile(entryFile: string) {
    const transformedCode = transformer(entryFile);
    return transformedCode;
}
