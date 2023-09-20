import j from 'jscodeshift';
import { filterPropertyKeys } from '@utils/jsCodeShiftUtils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { parseExampleOptions } from '../../../../../ag-charts-community/src/chart/test/load-example';

/**
 * JS Code Shift transformer to generate plain entry file
 */

const paletteColors = [
    j.literal('#5984C2'),
    j.literal('#36A883'),
    // j.literal('#F5546F'),
    j.literal('#AC9BF5'),
    j.literal('#F5CA46'),
    j.literal('#F57940'),
    j.literal('#8B6FB8'),
    j.literal('#E8A7F0'),
    j.literal('#7BAFDF'),
    j.literal('#65CC8D'),
    j.literal('#B2DB6A'),
    j.literal('#32B33B'),
    j.literal('#758080'),
    j.literal('#284E8F'),
    j.literal('#F5BFAE'),
    j.literal('#D65653'),
    j.literal('#B3AC4C'),
    j.literal('#758080'),
    j.literal('#A0CEF5'),
    j.literal('#357A72'),
];

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
    const propertiesToRemove = ['subtitle', 'footnote', 'legend', 'padding'];
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

    const optionsExpressionProperties = optionsExpression.get(0).node.properties;
    optionsExpressionProperties.push(legendPropertyNode);

    // Theme
    const themeNode = optionsExpression
        .find(j.Property, {
            key: {
                name: 'theme',
            },
        })
        .find(j.ObjectExpression);

    const themeBarOverrides = j.property(
        'init',
        j.identifier('bar'),
        j.objectExpression([
            j.property(
                'init',
                j.identifier('series'),
                j.objectExpression([j.property('init', j.identifier('strokeWidth'), j.literal(0))])
            ),
        ])
    );
    const themeBubbleOverrides = j.property(
        'init',
        j.identifier('bubble'),
        j.objectExpression([
            j.property(
                'init',
                j.identifier('series'),
                j.objectExpression([
                    j.property(
                        'init',
                        j.identifier('marker'),
                        j.objectExpression([j.property('init', j.identifier('fillOpacity'), j.literal(0.7))])
                    ),
                ])
            ),
        ])
    );
    const themeHistogramOverrides = j.property(
        'init',
        j.identifier('histogram'),
        j.objectExpression([
            j.property(
                'init',
                j.identifier('series'),
                j.objectExpression([
                    j.property('init', j.identifier('fillOpacity'), j.literal(0.6)),
                    j.property(
                        'init',
                        j.identifier('shadow'),
                        j.objectExpression([j.property('init', j.identifier('enabled'), j.literal(false))])
                    ),
                ])
            ),
        ])
    );

    const themeCommonOverridesProperty = j.property(
        'init',
        j.identifier('common'),
        j.objectExpression([
            j.property(
                'init',
                j.identifier('title'),
                j.objectExpression([
                    j.property('init', j.identifier('fontWeight'), j.literal('normal')),
                    j.property('init', j.identifier('fontFamily'), j.literal('sans-serif')),
                    j.property('init', j.identifier('fontSize'), j.literal(18)),
                    j.property('init', j.identifier('spacing'), j.literal(20)),
                ])
            ),
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
                                j.identifier('tick'),
                                j.objectExpression([j.property('init', j.identifier('width'), j.literal(0))])
                            ),
                            j.property(
                                'init',
                                j.identifier('label'),
                                j.objectExpression([j.property('init', j.identifier('color'), j.literal('#64676e'))])
                            ),
                            j.property(
                                'init',
                                j.identifier('title'),
                                j.objectExpression([
                                    j.property('init', j.identifier('color'), j.literal('#64676e')),
                                    j.property('init', j.identifier('fontFamily'), j.literal('sans-serif')),
                                ])
                            ),
                        ])
                    ),
                    j.property(
                        'init',
                        j.identifier('number'),
                        j.objectExpression([
                            j.property(
                                'init',
                                j.identifier('line'),
                                j.objectExpression([j.property('init', j.identifier('width'), j.literal(0))])
                            ),
                            j.property(
                                'init',
                                j.identifier('gridStyle'),
                                j.arrayExpression([
                                    j.objectExpression([
                                        j.property('init', j.identifier('stroke'), j.literal('#e7e4e5')),
                                        j.property('init', j.identifier('lineDash'), j.arrayExpression([j.literal(0)])),
                                    ]),
                                ])
                            ),
                            j.property(
                                'init',
                                j.identifier('tick'),
                                j.objectExpression([j.property('init', j.identifier('size'), j.literal(0))])
                            ),
                            j.property(
                                'init',
                                j.identifier('title'),
                                j.objectExpression([
                                    j.property('init', j.identifier('color'), j.literal('#64676e')),
                                    j.property('init', j.identifier('fontFamily'), j.literal('sans-serif')),
                                ])
                            ),
                        ])
                    ),
                    j.property(
                        'init',
                        j.identifier('time'),
                        j.objectExpression([
                            j.property(
                                'init',
                                j.identifier('tick'),
                                j.objectExpression([j.property('init', j.identifier('width'), j.literal(0))])
                            ),
                            j.property(
                                'init',
                                j.identifier('title'),
                                j.objectExpression([
                                    j.property('init', j.identifier('color'), j.literal('#64676e')),
                                    j.property('init', j.identifier('fontFamily'), j.literal('sans-serif')),
                                ])
                            ),
                        ])
                    ),
                ])
            ),
        ])
    );

    const themePaletteProperty = j.property(
        'init',
        j.identifier('palette'),
        j.objectExpression([
            j.property('init', j.identifier('fills'), j.arrayExpression(paletteColors)),
            j.property('init', j.identifier('strokes'), j.arrayExpression(paletteColors)),
        ])
    );

    const themeOverridesProperty = j.property(
        'init',
        j.identifier('overrides'),
        j.objectExpression([
            themeCommonOverridesProperty,
            themeBarOverrides,
            themeBubbleOverrides,
            themeHistogramOverrides,
        ])
    );

    if (themeNode.length > 0) {
        const themeNodeProperties = themeNode.get(0).node.properties;
        const overridesNode = themeNode
            .find(j.Property, {
                key: {
                    name: 'overrides',
                },
            })
            .find(j.ObjectExpression);

        if (overridesNode.length > 0) {
            const overridesNodeProperties = overridesNode.get(0).node.properties;
            overridesNodeProperties.filter((property: any) => property.key?.value === 'common');
            overridesNodeProperties.push(themeCommonOverridesProperty);
        } else {
            themeNodeProperties.filter((property: any) => property.key?.value === 'overrides');
            themeNodeProperties.push(themeOverridesProperty);
        }

        // Add palette
        themeNodeProperties.filter((property: any) => property.key?.value === 'palette');
        themeNodeProperties.push(themePaletteProperty);
    } else {
        optionsExpressionProperties.filter((property: any) => property.key?.value === 'theme');
        optionsExpressionProperties.push(
            j.property(
                'init',
                j.identifier('theme'),
                j.objectExpression([themeOverridesProperty, themePaletteProperty])
            )
        );
    }

    // Remove any padding
    const paddingPropertyNode = j.property(
        'init',
        j.identifier('padding'),
        j.objectExpression([
            j.property('init', j.identifier('top'), j.literal(0)),
            j.property('init', j.identifier('right'), j.literal(25)),
            j.property('init', j.identifier('bottom'), j.literal(0)),
            j.property('init', j.identifier('left'), j.literal(25)),
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
