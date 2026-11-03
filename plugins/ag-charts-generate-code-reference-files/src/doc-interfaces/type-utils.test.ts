import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { formatNode } from './type-utils';

function formatInterface(source: string) {
    const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
    const declaration = sourceFile.statements.find(ts.isInterfaceDeclaration);
    expect(declaration).toBeDefined();
    return formatNode(declaration!);
}

describe('formatNode underscore-prefixed type parameters', () => {
    const node = formatInterface(`
        interface Params<_TDatum = never, TContext = unknown> extends Mixin<_TDatum, TContext> {
            items: Item<_TDatum, TContext>[];
            theme: _THEME_OVERRIDES;
        }
    `);

    it('drops the underscore from the declared name', () => {
        expect(node.typeParams.map((param: { name: string }) => param.name)).toEqual(['TDatum', 'TContext']);
    });

    it('drops the underscore from references to the parameter', () => {
        expect(node.heritage).toEqual([{ kind: 'typeRef', type: 'Mixin', typeArguments: ['TDatum', 'TContext'] }]);
        expect(node.members[0].type).toEqual({
            kind: 'array',
            type: { kind: 'typeRef', type: 'Item', typeArguments: ['TDatum', 'TContext'] },
        });
    });

    it('keeps underscore-prefixed names that are not type parameters', () => {
        expect(node.members[1].type).toBe('_THEME_OVERRIDES');
    });
});
