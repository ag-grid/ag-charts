import j from 'jscodeshift';

import type { AgChartThemeName } from 'ag-charts-community';
import * as agCharts from 'ag-charts-community';
import { parseExampleOptions } from 'ag-charts-test';

import { filterPropertyKeys } from './jsCodeShiftUtils';

/**
 * JS Code Shift transformer to generate plain entry file
 */

function transformer(sourceFile: string, dataFile?: string, themeName?: AgChartThemeName) {
    const root = j(sourceFile);
    const optionsExpression = root
        .find(j.VariableDeclarator, { id: { type: 'Identifier', name: 'options' } })
        .find(j.ObjectExpression);

    // Find and remove properties in the 'options' object
    // Add 'title' to remove titles for images for homepage scrolling hero
    const propertiesToRemove = ['subtitle', 'footnote', 'legend', 'gradientLegend'];

    optionsExpression.forEach((path) => {
        path.node.properties = filterPropertyKeys({
            removePropertyKeys: propertiesToRemove,
            properties: path.node.properties,
        });
    });

    const optionsNode = optionsExpression.get(0).node;

    // Remove padding
    optionsNode.properties = optionsNode.properties.filter((property: any) => property.key?.name !== 'padding');
    const optionsExpressionProperties = optionsNode.properties;

    // Add disabled legend
    const legendPropertyNode = j.property(
        'init',
        j.identifier('legend'),
        j.objectExpression([j.property('init', j.identifier('enabled'), j.literal(false))])
    );
    optionsExpressionProperties.push(legendPropertyNode);

    // Add disabled gradient legend
    const gradientLegendPropertyNode = j.property(
        'init',
        j.identifier('gradientLegend'),
        j.objectExpression([j.property('init', j.identifier('enabled'), j.literal(false))])
    );
    optionsExpressionProperties.push(gradientLegendPropertyNode);

    // Theme - Apply baseTheme and disable category axis autoRotate
    const themeNode = optionsExpression.find(j.Property, { key: { name: 'theme' } }).find(j.ObjectExpression);

    const baseThemeProperty = j.property('init', j.identifier('baseTheme'), j.literal(themeName ?? 'ag-default'));

    const themeCommonOverridesProperty = j.property(
        'init',
        j.identifier('common'),
        j.objectExpression([
            j.property(
                'init',
                j.identifier('axes'),
                j.objectExpression([
                    j.property(
                        'init',
                        j.identifier('category'),
                        j.objectExpression([
                            j.property(
                                'init',
                                j.identifier('label'),
                                j.objectExpression([
                                    j.property('init', j.identifier('autoRotate'), j.literal(false)),
                                    j.property('init', j.identifier('minSpacing'), j.literal(20)),
                                ])
                            ),
                        ])
                    ),
                ])
            ),
        ])
    );

    const themeOverridesProperty = j.property(
        'init',
        j.identifier('overrides'),
        j.objectExpression([themeCommonOverridesProperty])
    );

    if (themeNode.length > 0) {
        const themeNodeProperties = themeNode.get(0).node.properties;
        // Add baseTheme
        themeNodeProperties.push(baseThemeProperty);

        // Add overrides
        const overridesNode = themeNode.find(j.Property, { key: { name: 'overrides' } }).find(j.ObjectExpression);

        if (overridesNode.length > 0) {
            const overridesNodeProperties = overridesNode.get(0).node.properties;
            overridesNodeProperties.filter((property: any) => property.key?.value === 'common');
            overridesNodeProperties.push(themeCommonOverridesProperty);
        } else {
            themeNodeProperties.filter((property: any) => property.key?.value === 'overrides');
            themeNodeProperties.push(themeOverridesProperty);
        }
    } else {
        optionsExpressionProperties.filter((property: any) => property.key?.value === 'theme');
        optionsExpressionProperties.push(
            j.property('init', j.identifier('theme'), j.objectExpression([baseThemeProperty, themeOverridesProperty]))
        );
    }

    // Axes
    optionsExpression
        .find(j.Property, { key: { name: 'axes' } })
        .find(j.ObjectExpression)
        .forEach((path) => {
            const propertiesNode = path.node;

            // Remove axis title
            const title = propertiesNode.properties.find((prop: any) => prop.key?.name === 'title');
            if (title) {
                propertiesNode.properties = filterPropertyKeys({
                    removePropertyKeys: ['title'],
                    properties: propertiesNode.properties,
                });
                propertiesNode.properties.push(
                    j.property(
                        'init',
                        j.identifier('title'),
                        j.objectExpression([j.property('init', j.identifier('enabled'), j.literal(false))])
                    )
                );
            }
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
    const options = parseExampleOptions('options', code, dataFile, { agCharts });

    return { code, options };
}

export function transformPlainEntryFile(
    entryFile: string,
    dataFile?: string,
    themeName?: AgChartThemeName
): { code: string; options: agCharts.AgChartOptions } {
    return transformer(entryFile, dataFile, themeName);
}
